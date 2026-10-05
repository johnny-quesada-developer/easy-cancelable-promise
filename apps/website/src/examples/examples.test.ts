import { isPrime, primesInStep, STEP_SIZE, type Step } from './shared/work';
import { searchWithCancelablePromise, searchWithNativePromise } from './shared/search';
import { runInBatches } from './group/batches';
import { createLog } from './shared/log';
import { count, milliseconds } from './shared/format';
import { groupAsCancelablePromise, isCancelablePromise } from 'easy-cancelable-promise';

/**
 * The logic behind the examples, tested as ordinary functions against the built package.
 * The examples themselves run in a browser in visual/demos.spec.ts.
 */
describe('example logic', () => {
  it('recognizes prime numbers', () => {
    const primes = Array.from({ length: 30 }, (_, value) => value).filter(isPrime);

    expect(primes).toEqual([2, 3, 5, 7, 11, 13, 17, 19, 23, 29]);
  });

  it('counts the primes of a step', () => {
    expect(STEP_SIZE).toBe(20_000);
    expect(primesInStep(0)).toBe(2262);
    expect(primesInStep(0) + primesInStep(1)).toBe(4203);
  });

  it('formats the measured values', () => {
    expect(milliseconds(1019.6)).toBe('1,020 ms');
    expect(count(39088169)).toBe('39,088,169');
  });

  it('delivers the status line to its listeners until they unsubscribe', () => {
    const log = createLog();
    const listener = vi.fn();
    const stop = log.watch(listener);

    log.write('first');
    stop();
    log.write('second');

    expect(listener.mock.calls).toEqual([['first']]);
  });

  describe('the search', () => {
    beforeEach(() => vi.useFakeTimers());
    afterEach(() => vi.useRealTimers());

    it('finds the same primes in a Promise and in a CancelablePromise', async () => {
      const native = searchWithNativePromise({ steps: 4, pause: 10 });
      const cancelable = searchWithCancelablePromise({ steps: 4, pause: 10 });

      await vi.advanceTimersByTimeAsync(40);

      expect(await native).toBe(7837);
      expect(await cancelable).toBe(7837);
      expect(isCancelablePromise(cancelable)).toBe(true);
      expect(isCancelablePromise(native)).toBe(false);
    });

    it('searches the range that starts in `from`', async () => {
      const search = searchWithCancelablePromise({ from: 1, steps: 1, pause: 10 });

      await vi.advanceTimersByTimeAsync(10);

      expect(await search).toBe(primesInStep(1));
    });

    it('reports each step, and the progress through the promise', async () => {
      const steps: Step[] = [];
      const progress: number[] = [];

      const search = searchWithCancelablePromise({ steps: 4, pause: 10, onStep: (step) => steps.push(step) }).onProgress((percentage) =>
        progress.push(percentage),
      );

      await vi.advanceTimersByTimeAsync(40);
      await search;

      expect(steps.map(({ step }) => step)).toEqual([1, 2, 3, 4]);
      expect(progress).toEqual([25, 50, 75, 100]);
    });

    it('a canceled CancelablePromise runs no more steps', async () => {
      const onStep = vi.fn();
      const search = searchWithCancelablePromise({ steps: 10, pause: 10, onStep });

      await vi.advanceTimersByTimeAsync(30);
      search.cancel('Stopped by user');
      await vi.advanceTimersByTimeAsync(1000);

      expect(onStep).toHaveBeenCalledTimes(3);
      expect(vi.getTimerCount()).toBe(0);
      expect(search.status).toBe('canceled');
      await expect(search).rejects.toBe('Stopped by user');
    });

    it('a native Promise runs every step, there is nothing to stop it with', async () => {
      const onStep = vi.fn();
      const search = searchWithNativePromise({ steps: 10, pause: 10, onStep });

      await vi.advanceTimersByTimeAsync(30);
      expect(onStep).toHaveBeenCalledTimes(3);

      await vi.advanceTimersByTimeAsync(1000);

      expect(onStep).toHaveBeenCalledTimes(10);
      expect(await search).toBeGreaterThan(0);
    });
  });

  describe('the group', () => {
    beforeEach(() => vi.useFakeTimers());
    afterEach(() => vi.useRealTimers());

    const tasks = (search: typeof searchWithNativePromise, started: number[]) =>
      Array.from({ length: 6 }, (_, index) => () => {
        started.push(index + 1);

        return search({ from: index, steps: 1, pause: 10 });
      });

    it('the queue written by hand and the cancelable group find the same primes', async () => {
      const queue = runInBatches(tasks(searchWithNativePromise, []), 2);
      const group = groupAsCancelablePromise<number[]>(tasks(searchWithCancelablePromise, []), { maxConcurrent: 2 });

      await vi.advanceTimersByTimeAsync(30);

      const expected = [0, 1, 2, 3, 4, 5].map(primesInStep);

      expect(await queue).toEqual(expected);
      expect(await group).toEqual(expected);
    });

    it('a canceled group starts no more tasks, the queue written by hand starts them all', async () => {
      const startedInQueue: number[] = [];
      const startedInGroup: number[] = [];

      const queue = runInBatches(tasks(searchWithNativePromise, startedInQueue), 2);
      const group = groupAsCancelablePromise<number[]>(tasks(searchWithCancelablePromise, startedInGroup), { maxConcurrent: 2 })!;

      group.cancel('Stopped by user');
      await vi.advanceTimersByTimeAsync(1000);

      expect(startedInGroup).toEqual([1, 2]);
      expect(startedInQueue).toEqual([1, 2, 3, 4, 5, 6]);
      expect(group.status).toBe('canceled');
      await expect(group).rejects.toBe('Stopped by user');
      expect(await queue).toHaveLength(6);
    });
  });
});
