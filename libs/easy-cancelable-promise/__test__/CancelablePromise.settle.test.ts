import { CancelablePromise, defer } from 'easy-cancelable-promise';

const nextTick = () => new Promise<void>((resolve) => setTimeout(resolve, 0));

describe('CancelablePromise settle rules', () => {
  it('should ignore resolve after the promise was canceled', async () => {
    const deferred = defer<string>();

    deferred.cancel('reason');
    deferred.resolve('result');

    expect(deferred.promise.status).toBe('canceled');
    await expect(deferred.promise).rejects.toBe('reason');
  });

  it('should ignore reject after the promise was canceled', async () => {
    const deferred = defer<string>();

    deferred.cancel('reason');
    deferred.reject('error');

    expect(deferred.promise.status).toBe('canceled');
    await expect(deferred.promise).rejects.toBe('reason');
  });

  it('should ignore reject after the promise was resolved', async () => {
    const deferred = defer<string>();

    deferred.resolve('result');
    deferred.reject('error');

    expect(deferred.promise.status).toBe('resolved');
    expect(await deferred.promise).toBe('result');
  });

  it('should ignore resolve after the promise was rejected', async () => {
    const deferred = defer<string>();

    deferred.reject('error');
    deferred.resolve('result');

    expect(deferred.promise.status).toBe('rejected');
    await expect(deferred.promise).rejects.toBe('error');
  });

  it('should only consider the first resolved value', async () => {
    const deferred = defer<string>();

    deferred.resolve('first');
    deferred.resolve('second');

    expect(await deferred.promise).toBe('first');
  });

  it('should keep the callbacks until the promise is settled', async () => {
    const cancelLogger = vi.fn();
    const deferred = defer<string>();

    deferred.promise.onCancel(cancelLogger);
    deferred.resolve('result');
    deferred.promise.cancel();

    expect(cancelLogger).not.toHaveBeenCalled();
    expect(await deferred.promise).toBe('result');
  });

  it('should follow the status of a promise used as result', async () => {
    const resolved = new CancelablePromise<string>((resolve) =>
      resolve(Promise.resolve('result')),
    );

    const rejected = new CancelablePromise<string>((resolve) =>
      resolve(Promise.reject('error')),
    );

    expect(resolved.status).toBe('pending');
    expect(rejected.status).toBe('pending');

    expect(await resolved).toBe('result');
    await expect(rejected).rejects.toBe('error');

    expect(resolved.status).toBe('resolved');
    expect(rejected.status).toBe('rejected');
  });

  it('should be cancelable while it waits for a promise used as result', async () => {
    const cancelLogger = vi.fn();
    const inner = defer<string>();

    const promise = new CancelablePromise<string>(
      (resolve, _, { onCancel }) => {
        onCancel(cancelLogger);

        resolve(inner.promise);
      },
    );

    await expect(promise.cancel('reason')).rejects.toBe('reason');

    inner.resolve('result');
    await nextTick();

    expect(promise.status).toBe('canceled');
    expect(cancelLogger).toHaveBeenCalledWith('reason');
  });

  it('should reject the promise when the callback throws', async () => {
    const error = new Error('callback error');

    const promise = new CancelablePromise<string>(() => {
      throw error;
    });

    expect(promise.status).toBe('rejected');
    await expect(promise).rejects.toBe(error);
  });

  it('should ignore an error of the callback after the promise was resolved', async () => {
    const promise = new CancelablePromise<string>((resolve) => {
      resolve('result');

      throw new Error('callback error');
    });

    expect(promise.status).toBe('resolved');
    expect(await promise).toBe('result');
  });

  it('should reject the promise when an async callback throws', async () => {
    const error = new Error('callback error');

    const promise = new CancelablePromise<string>(async () => {
      await Promise.resolve();

      throw error;
    });

    expect(promise.status).toBe('pending');
    await expect(promise).rejects.toBe(error);
    expect(promise.status).toBe('rejected');
  });

  it('should ignore an error of an async callback after the promise was settled', async () => {
    const resolved = new CancelablePromise<string>(async (resolve) => {
      resolve('result');

      await Promise.resolve();

      throw new Error('callback error');
    });

    const canceled = new CancelablePromise<string>(async () => {
      await nextTick();

      throw new Error('callback error');
    });

    canceled.cancel('reason');

    await nextTick();
    await nextTick();

    expect(await resolved).toBe('result');
    expect(resolved.status).toBe('resolved');
    expect(canceled.status).toBe('canceled');
    await expect(canceled).rejects.toBe('reason');
  });

  it('should resolve from an async callback', async () => {
    const promise = new CancelablePromise<string>(async (resolve) => {
      resolve(await Promise.resolve('result'));
    });

    expect(await promise).toBe('result');
    expect(promise.status).toBe('resolved');
  });

  it('should cancel the promise even if a cancel callback throws', async () => {
    const error = new Error('listener error');
    const ownLogger = vi.fn();
    const firstLogger = vi.fn(() => {
      throw error;
    });
    const secondLogger = vi.fn();

    const promise = new CancelablePromise<string>((_, __, { onCancel }) => {
      onCancel(ownLogger);
    })
      .onCancel(firstLogger)
      .onCancel(secondLogger);

    // the error of the callback is reported once the promise is canceled
    expect(() => promise.cancel('reason')).toThrow(error);

    expect(promise.status).toBe('canceled');
    expect(ownLogger).toHaveBeenCalledWith('reason');
    expect(firstLogger).toHaveBeenCalledWith('reason');
    expect(secondLogger).toHaveBeenCalledWith('reason');

    await expect(promise).rejects.toBe('reason');
  });
});

describe('a promise resolved with another promise', () => {
  const wait = (milliseconds: number) =>
    new Promise<void>((resolve) => setTimeout(resolve, milliseconds));

  it('should cancel the CancelablePromise it was resolved with', async () => {
    let innerOnCancel = false;
    let workFinished = false;

    const inner = new CancelablePromise<string>((resolve, _, { onCancel }) => {
      const timer = setTimeout(() => {
        workFinished = true;
        resolve('inner done');
      }, 60);

      onCancel(() => {
        innerOnCancel = true;
        clearTimeout(timer);
      });
    });

    const outer = new CancelablePromise<string>((resolve) => resolve(inner));

    outer.cancel('why');

    expect(outer.status).toBe('canceled');
    expect(inner.status).toBe('canceled');
    expect(innerOnCancel).toBe(true);

    await wait(120);

    expect(workFinished).toBe(false);
    expect(inner.status).toBe('canceled');
    await expect(outer).rejects.toBe('why');
    await expect(inner).rejects.toBe('why');
  });

  it('should not touch a result that already settled', async () => {
    const cancelLogger = vi.fn();
    const inner =
      CancelablePromise.resolve('inner done').onCancel(cancelLogger);

    const outer = new CancelablePromise<string>((resolve) => resolve(inner));

    expect(outer.status).toBe('pending');
    expect(() => outer.cancel('why')).not.toThrow();

    expect(outer.status).toBe('canceled');
    expect(inner.status).toBe('resolved');
    expect(cancelLogger).not.toHaveBeenCalled();
    expect(await inner).toBe('inner done');
    await expect(outer).rejects.toBe('why');
  });

  it('should ignore a native promise used as result after the cancel', async () => {
    const unhandled = vi.fn();

    process.on('unhandledRejection', unhandled);

    const resolved = new Promise<string>((resolve) =>
      setTimeout(() => resolve('late'), 10),
    );
    const rejected = new Promise<string>((_, reject) =>
      setTimeout(() => reject(new Error('late error')), 10),
    );

    const first = new CancelablePromise<string>((resolve) => resolve(resolved));
    const second = new CancelablePromise<string>((resolve) =>
      resolve(rejected),
    );

    first.cancel('why');
    second.cancel('why');

    await wait(40);

    process.off('unhandledRejection', unhandled);

    expect(first.status).toBe('canceled');
    expect(second.status).toBe('canceled');
    expect(unhandled).not.toHaveBeenCalled();
    await expect(first).rejects.toBe('why');
    await expect(second).rejects.toBe('why');
  });

  it('should cancel the promise even if a cancel callback of the result throws', async () => {
    const error = new Error('inner listener error');

    const inner = new CancelablePromise<string>(() => {}).onCancel(() => {
      throw error;
    });

    const outer = new CancelablePromise<string>((resolve) => resolve(inner));

    // the error is reported once both promises are canceled, as with the other cancel callbacks
    expect(() => outer.cancel('why')).toThrow(error);

    expect(outer.status).toBe('canceled');
    expect(inner.status).toBe('canceled');
    await expect(outer).rejects.toBe('why');
    await expect(inner).rejects.toBe('why');
  });

  it('should reach every level of promises resolved with promises', async () => {
    const cancelLogger = vi.fn();

    const inner = new CancelablePromise<string>((_, __, { onCancel }) => {
      onCancel(cancelLogger);
    });
    const middle = new CancelablePromise<string>((resolve) => resolve(inner));
    const outer = new CancelablePromise<string>((resolve) => resolve(middle));

    outer.cancel('why');

    expect(outer.status).toBe('canceled');
    expect(middle.status).toBe('canceled');
    expect(inner.status).toBe('canceled');
    expect(cancelLogger).toHaveBeenCalledWith('why');
    await expect(outer).rejects.toBe('why');
  });

  it('should stop listening to the cancellation once the result settles', async () => {
    const inner = CancelablePromise.resolve('inner done');
    const outer = new CancelablePromise<string>((resolve) => resolve(inner));

    expect(await outer).toBe('inner done');
    expect(outer.cancel('why').status).toBe('resolved');
  });
});

describe('promises chained from a canceled promise', () => {
  it('should be canceled when the promise they were created from is canceled', async () => {
    const cancelLogger = vi.fn();
    const promise = new CancelablePromise<string>(() => {});

    const child = promise.then((value) => value.length);
    const grandchild = child.then((value) => value * 2).onCancel(cancelLogger);
    const afterFinally = promise.finally(() => {});

    promise.cancel('reason');

    await expect(grandchild).rejects.toBe('reason');
    await expect(afterFinally).rejects.toBe('reason');

    expect(promise.status).toBe('canceled');
    expect(child.status).toBe('canceled');
    expect(grandchild.status).toBe('canceled');
    expect(afterFinally.status).toBe('canceled');
    expect(cancelLogger).toHaveBeenCalledWith('reason');
  });

  describe('unhandled rejections', () => {
    // the listeners of the test runner are set aside so the rejections can be counted here
    const collect = async (run: () => void) => {
      const reasons: unknown[] = [];
      const listeners = process.listeners('unhandledRejection');
      const listener = (reason: unknown) => reasons.push(reason);

      process.removeAllListeners('unhandledRejection');
      process.on('unhandledRejection', listener);

      try {
        run();

        await new Promise((resolve) => setTimeout(resolve, 20));
      } finally {
        process.off('unhandledRejection', listener);
        listeners.forEach((existing) =>
          process.on('unhandledRejection', existing),
        );
      }

      return reasons;
    };

    it('should report a chained promise that has no handler for the cancellation', async () => {
      let chained: CancelablePromise<void>;

      const reasons = await collect(() => {
        const promise = new CancelablePromise<string>(() => {});

        chained = promise.then(() => {});

        promise.cancel('x');
      });

      expect(reasons).toEqual(['x']);
      expect(chained.status).toBe('canceled');
    });

    it('should report only the last promise of a chain', async () => {
      const reasons = await collect(() => {
        const promise = new CancelablePromise<string>(() => {});

        promise
          .then(() => {})
          .then(() => {})
          .finally(() => {});

        promise.cancel('x');
      });

      expect(reasons).toEqual(['x']);
    });

    it('should not report the promise that was canceled, nor a chain that handles it', async () => {
      const reasons = await collect(() => {
        const alone = new CancelablePromise<string>(() => {});
        const withChain = new CancelablePromise<string>(() => {});
        const fromTheEnd = new CancelablePromise<string>(() => {});

        withChain.then(() => {}).catch(() => {});

        alone.cancel('x');
        withChain.cancel('x');

        // cancel called on the chained promise: it is the one that was canceled
        fromTheEnd.then(() => {}).cancel('x');
      });

      expect(reasons).toEqual([]);
    });
  });

  it('should follow the handler that dealt with the cancellation', async () => {
    const promise = new CancelablePromise<string>(() => {});

    const handled = promise.catch(() => 'handled');
    const replaced = promise.catch(() => {
      throw new Error('another error');
    });

    promise.cancel('reason');

    expect(await handled).toBe('handled');
    await expect(replaced).rejects.toThrow('another error');

    expect(handled.status).toBe('resolved');
    expect(replaced.status).toBe('rejected');
  });

  it('should be rejected, not canceled, when the promise is rejected', async () => {
    const promise = new CancelablePromise<string>((_, reject) =>
      reject('error'),
    );

    const child = promise.then((value) => value.length);

    await expect(child).rejects.toBe('error');

    expect(child.status).toBe('rejected');
  });
});

describe('CancelablePromise statics with special collections', () => {
  it('all should resolve an empty collection', async () => {
    const promise = CancelablePromise.all([]);

    expect(await promise).toEqual([]);
    expect(promise.status).toBe('resolved');
  });

  it('allSettled should resolve an empty collection', async () => {
    const promise = CancelablePromise.allSettled([]);

    expect(await promise).toEqual([]);
    expect(promise.status).toBe('resolved');
  });

  it('race should stay pending with an empty collection, same as the native Promise', async () => {
    const promise = CancelablePromise.race([]);

    await nextTick();

    expect(promise.status).toBe('pending');
  });

  it('all should keep a result for each value when a promise is repeated', async () => {
    const repeated = CancelablePromise.resolve(1);
    const slow = new CancelablePromise<number>((resolve) =>
      setTimeout(() => resolve(2), 5),
    );

    expect(await CancelablePromise.all([repeated, slow, repeated, 3])).toEqual([
      1, 2, 1, 3,
    ]);
  });

  it('allSettled should report the canceled promises with their own status', async () => {
    const canceled = new CancelablePromise<string>(() => {});

    canceled.cancel('reason');

    const [first, second] = await CancelablePromise.allSettled([
      canceled,
      CancelablePromise.reject('error'),
    ]);

    expect(first).toEqual({ status: 'canceled', reason: 'reason' });
    expect(second).toEqual({ status: 'rejected', reason: 'error' });
  });

  it('allSettled should keep a result for each value when a promise is repeated', async () => {
    const repeated = CancelablePromise.resolve(1);
    const rejected = CancelablePromise.reject('error');

    expect(
      await CancelablePromise.allSettled([repeated, rejected, repeated]),
    ).toEqual([
      { status: 'fulfilled', value: 1 },
      { status: 'rejected', reason: 'error' },
      { status: 'fulfilled', value: 1 },
    ]);
  });
});
