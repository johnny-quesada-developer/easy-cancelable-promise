import {
  CancelablePromise,
  groupAsCancelablePromise,
  isCancelablePromise,
} from 'easy-cancelable-promise';

const wait = <T>(value: T, milliseconds: number) =>
  new Promise<T>((resolve) => setTimeout(() => resolve(value), milliseconds));

describe('groupAsCancelablePromise', () => {
  it('should return null when there are no sources', () => {
    expect(groupAsCancelablePromise([])).toBeNull();
  });

  it('should resolve with the results of functions, promises and cancelable promises', async () => {
    const group = groupAsCancelablePromise<string[]>([
      () => Promise.resolve('function'),
      Promise.resolve('promise'),
      new CancelablePromise<string[]>((resolve) =>
        resolve('cancelable' as unknown as string[]),
      ),
    ]);

    expect(isCancelablePromise(group)).toBe(true);

    const results = await group;

    expect(results).toEqual(['function', 'promise', 'cancelable']);
    expect(group.status).toBe('resolved');
  });

  it('should call the callbacks of the configuration', async () => {
    const beforeEachCallback = vi.fn();
    const afterEachCallback = vi.fn();
    const onQueueEmptyCallback = vi.fn();

    const results = await groupAsCancelablePromise<number[]>(
      [() => Promise.resolve(1), () => Promise.resolve(2)],
      { beforeEachCallback, afterEachCallback, onQueueEmptyCallback },
    );

    expect(beforeEachCallback).toHaveBeenCalledTimes(2);
    expect(afterEachCallback.mock.calls).toEqual([[1], [2]]);
    expect(onQueueEmptyCallback).toHaveBeenCalledTimes(1);
    expect(onQueueEmptyCallback).toHaveBeenCalledWith(results);
  });

  it('should not start more sources than maxConcurrent at the same time', async () => {
    let running = 0;
    let maxRunning = 0;

    const source = (value: number) => async () => {
      running++;
      maxRunning = Math.max(maxRunning, running);

      await wait(value, 5);

      running--;

      return value;
    };

    const results = await groupAsCancelablePromise<number[]>(
      [source(1), source(2), source(3), source(4), source(5)],
      { maxConcurrent: 2 },
    );

    expect(maxRunning).toBe(2);
    expect(results).toEqual([1, 2, 3, 4, 5]);
  });

  it('should execute one source at a time when maxConcurrent is lower than 1', async () => {
    let running = 0;
    let maxRunning = 0;

    const source = (value: number) => async () => {
      running++;
      maxRunning = Math.max(maxRunning, running);

      await wait(value, 0);

      running--;

      return value;
    };

    expect(
      await groupAsCancelablePromise<number[]>([source(1), source(2)], {
        maxConcurrent: 0,
      }),
    ).toEqual([1, 2]);

    expect(
      await groupAsCancelablePromise<number[]>([source(3), source(4)], {
        maxConcurrent: -1,
      }),
    ).toEqual([3, 4]);

    expect(maxRunning).toBe(1);
  });

  it('should resolve all the sources with executeInOrder', async () => {
    const results = await groupAsCancelablePromise<number[]>(
      [() => wait(1, 5), () => wait(2, 0)],
      { executeInOrder: true },
    );

    expect(results).toEqual([1, 2]);
  });

  it('should report the progress of the group', async () => {
    const progressLogger = vi.fn();

    await groupAsCancelablePromise([
      () => wait(1, 0),
      () => wait(2, 5),
    ]).onProgress(progressLogger);

    expect(progressLogger.mock.calls).toEqual([
      [50, undefined],
      [100, undefined],
    ]);
  });

  it('should keep the results in the position of their sources', async () => {
    const results = await groupAsCancelablePromise<[string, string, string]>([
      () => wait('slow', 10),
      () => wait('fast', 0),
      Promise.resolve('promise'),
    ]);

    expect(results).toEqual(['slow', 'fast', 'promise']);
  });

  it('should start each source after the previous one with executeInOrder', async () => {
    const events: string[] = [];

    const source = (name: string, milliseconds: number) => async () => {
      events.push(`start ${name}`);

      await wait(null, milliseconds);

      events.push(`end ${name}`);

      return name;
    };

    const results = await groupAsCancelablePromise<string[]>(
      [source('a', 10), source('b', 0), source('c', 0)],
      { executeInOrder: true },
    );

    expect(results).toEqual(['a', 'b', 'c']);
    expect(events).toEqual([
      'start a',
      'end a',
      'start b',
      'end b',
      'start c',
      'end c',
    ]);
  });

  it('should call beforeEachCallback before the source starts', async () => {
    const events: string[] = [];

    await groupAsCancelablePromise(
      [
        () => {
          events.push('source');

          return Promise.resolve(1);
        },
      ],
      { beforeEachCallback: () => events.push('before') },
    );

    expect(events).toEqual(['before', 'source']);
  });

  it('should reject the group when a source is rejected', async () => {
    const onQueueEmptyCallback = vi.fn();
    const neverStarted = vi.fn(() => Promise.resolve(3));

    const group = groupAsCancelablePromise(
      [() => Promise.resolve(1), () => Promise.reject('error'), neverStarted],
      { maxConcurrent: 2, onQueueEmptyCallback },
    );

    await expect(group).rejects.toBe('error');

    await wait(null, 5);

    expect(group.status).toBe('rejected');
    expect(onQueueEmptyCallback).not.toHaveBeenCalled();
    expect(neverStarted).not.toHaveBeenCalled();
  });

  it('should reject the group when a source throws', async () => {
    const group = groupAsCancelablePromise(
      [
        () => Promise.resolve(1),
        () => {
          throw new Error('source error');
        },
      ],
      { maxConcurrent: 1 },
    );

    await expect(group).rejects.toThrow('source error');
  });

  it('should cancel the pending sources when the group is canceled', async () => {
    const cancelLogger = vi.fn();
    const afterEachCallback = vi.fn();
    const neverStarted = vi.fn(() => Promise.resolve('never'));

    const pending = new CancelablePromise<string[]>(() => {}).onCancel(
      cancelLogger,
    );

    const group = groupAsCancelablePromise<string[]>(
      [() => Promise.resolve('done'), pending, neverStarted],
      { afterEachCallback, maxConcurrent: 2 },
    );

    // lets the first source resolve
    await wait(null, 5);

    await expect(group.cancel('reason')).rejects.toBe('reason');

    await wait(null, 5);

    expect(group.status).toBe('canceled');
    expect(pending.status).toBe('canceled');
    expect(cancelLogger).toHaveBeenCalledWith('reason');
    expect(afterEachCallback.mock.calls).toEqual([['done']]);
    expect(neverStarted).not.toHaveBeenCalled();
  });

  it('should cancel the group when one of the sources is canceled', async () => {
    const source = new CancelablePromise<string[]>(() => {});
    const other = new CancelablePromise<string[]>(() => {});

    const group = groupAsCancelablePromise<string[]>([source, other]);

    source.cancel('reason');

    await expect(group).rejects.toBe('reason');

    expect(group.status).toBe('canceled');
    expect(other.status).toBe('canceled');
  });
});
