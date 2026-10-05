import {
  CancelablePromise,
  defer,
  isCancelablePromise,
  isPromise,
  toCancelablePromise,
} from 'easy-cancelable-promise';
import type { CancelablePromiseUtils } from 'easy-cancelable-promise';

describe('CancelablePromise utils', () => {
  it('should expose the status of the promise to the callback', async () => {
    let utils: CancelablePromiseUtils<string>;

    const promise = new CancelablePromise<string>((resolve, _, _utils) => {
      utils = _utils;

      setTimeout(() => resolve('result'), 0);
    });

    expect(utils.status()).toBe('pending');
    expect(utils.isPending()).toBe(true);
    expect(utils.isCanceled()).toBe(false);

    await promise;

    expect(utils.status()).toBe('resolved');
    expect(utils.isPending()).toBe(false);
    expect(utils.isCanceled()).toBe(false);
  });

  it('should report the canceled status to the callback', async () => {
    const deferred = defer<string>();

    deferred.cancel('reason');

    expect(deferred.status()).toBe('canceled');
    expect(deferred.isCanceled()).toBe(true);
    expect(deferred.isPending()).toBe(false);

    await expect(deferred.promise).rejects.toBe('reason');
  });

  it('should report the progress from the callback', async () => {
    const progressLogger = vi.fn();
    const innerLogger = vi.fn();

    const promise = new CancelablePromise<void>(
      (resolve, _, { reportProgress, onProgress }) => {
        const unsubscribe = onProgress(innerLogger);

        setTimeout(() => {
          reportProgress(50, { step: 1 });
          unsubscribe();
          reportProgress(100);
          resolve();
        }, 0);
      },
    ).onProgress(progressLogger);

    await promise;

    expect(progressLogger.mock.calls).toEqual([
      [50, { step: 1 }],
      [100, undefined],
    ]);
    expect(innerLogger.mock.calls).toEqual([[50, { step: 1 }]]);
  });

  it('should report the progress to the chained promises', async () => {
    const progressLogger = vi.fn();
    const deferred = defer<number>();

    const child = deferred.promise.then((value) => value + 1);
    child.onProgress(progressLogger);

    deferred.promise.reportProgress(10);
    deferred.resolve(1);

    expect(await child).toBe(2);
    expect(progressLogger).toHaveBeenCalledWith(10, undefined);
  });

  it('should unsubscribe onCancel with a native AbortController', () => {
    const callsLogger = vi.fn();
    const controller = new AbortController();
    const promise = new CancelablePromise<void>(() => {});

    promise.onCancel(callsLogger, { signal: controller.signal });

    controller.abort();

    return promise.cancel().catch(() => {
      expect(callsLogger).not.toBeCalled();
      expect(promise.status).toBe('canceled');
    });
  });

  it('should unsubscribe onProgress with a native AbortController', () => {
    const callsLogger = vi.fn();
    const controller = new AbortController();
    const promise = new CancelablePromise<void>(() => {});

    promise.onProgress(callsLogger, { signal: controller.signal });

    promise.reportProgress(10);
    controller.abort();
    promise.reportProgress(20);

    expect(callsLogger.mock.calls).toEqual([[10, undefined]]);
  });

  it('should use a default reason when the promise is canceled without one', async () => {
    const promise = new CancelablePromise<void>(() => {});

    await expect(promise.cancel()).rejects.toThrow('Promise canceled');
  });

  it('should run the finally callback and keep the result', async () => {
    const finallyLogger = vi.fn();

    const promise = CancelablePromise.resolve('result').finally(finallyLogger);

    expect(isCancelablePromise(promise)).toBe(true);
    expect(await promise).toBe('result');
    expect(finallyLogger).toHaveBeenCalledTimes(1);
  });
});

describe('toCancelablePromise', () => {
  it('should return the same instance for a CancelablePromise', () => {
    const promise = new CancelablePromise<void>(() => {});

    expect(toCancelablePromise(promise)).toBe(promise);
  });

  it('should wrap a value', async () => {
    const promise = toCancelablePromise('value');

    expect(isCancelablePromise(promise)).toBe(true);
    expect(await promise).toBe('value');
    expect(promise.status).toBe('resolved');
  });

  it('should wrap the result of a function', async () => {
    const promise = toCancelablePromise(() => Promise.resolve('value'));

    expect(isCancelablePromise(promise)).toBe(true);
    expect(await promise).toBe('value');
  });

  it('should wrap a native promise', async () => {
    const resolved = toCancelablePromise(Promise.resolve('value'));
    const rejected = toCancelablePromise(Promise.reject('reason'));

    expect(isCancelablePromise(resolved)).toBe(true);
    expect(await resolved).toBe('value');
    await expect(rejected).rejects.toBe('reason');
  });

  it('should reject the wrapper of a native promise on cancel', async () => {
    const cancelLogger = vi.fn();
    const promise = toCancelablePromise(new Promise<string>(() => {}));

    promise.onCancel(cancelLogger);

    await expect(promise.cancel('reason')).rejects.toBe('reason');

    expect(cancelLogger).toHaveBeenCalledWith('reason');
  });
});

describe('guards', () => {
  it('isPromise should detect thenables', () => {
    expect(isPromise(Promise.resolve())).toBe(true);
    expect(isPromise(new CancelablePromise<void>(() => {}))).toBe(true);
    expect(isPromise({ then: () => {} })).toBe(true);
    expect(isPromise({ then: true })).toBe(false);
    expect(isPromise(null)).toBe(false);
    expect(isPromise('value')).toBe(false);
  });

  it('isCancelablePromise should only detect CancelablePromise instances', () => {
    expect(isCancelablePromise(new CancelablePromise<void>(() => {}))).toBe(
      true,
    );
    expect(isCancelablePromise(Promise.resolve())).toBe(false);
    expect(isCancelablePromise(null)).toBe(false);
    expect(isCancelablePromise(undefined)).toBe(false);
    expect(isCancelablePromise({})).toBe(false);
  });
});
