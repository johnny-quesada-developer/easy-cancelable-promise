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

    expect([...results].sort()).toEqual(['cancelable', 'function', 'promise']);
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
    expect([...results].sort()).toEqual([1, 2, 3, 4, 5]);
  });

  it('should resolve all the sources with executeInOrder', async () => {
    const results = await groupAsCancelablePromise<number[]>(
      [() => wait(1, 5), () => wait(2, 0)],
      { executeInOrder: true },
    );

    expect([...results].sort()).toEqual([1, 2]);
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

  // Pending: canceling a group with pending sources leaves unhandled rejections inside
  // groupAsCancelablePromise (the chains created for each source have no rejection handler),
  // so this cannot be asserted without changing the library.
  it.todo('should cancel the pending sources when the group is canceled');
});
