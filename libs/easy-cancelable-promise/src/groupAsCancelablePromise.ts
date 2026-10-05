import toCancelablePromise from './toCancelablePromise';
import CancelablePromise from './CancelablePromise';

/** Factory function that returns a Promise or CancelablePromise. */
export type CancelablePromiseBuildCallback<T = unknown> = () =>
  | Promise<T>
  | CancelablePromise<T>;

/** Configuration options for grouping CancelablePromises. */
export type CancelablePromiseGroupConfig = {
  /** Maximum number of promises to execute concurrently. Default: 8 */
  maxConcurrent?: number;
  /** If true, promises execute sequentially in order. Default: false */
  executeInOrder?: boolean;
  /** Callback invoked before each promise execution */
  beforeEachCallback?: () => void;
  /** Callback invoked after each successful promise resolution */
  afterEachCallback?: (result: unknown) => void;
  /** Callback invoked when all promises have completed */
  onQueueEmptyCallback?: (result: unknown[] | null) => void;
};

/**
 * Groups multiple promises or promise factories into a single CancelablePromise.
 * If canceled, all pending promises in the group are canceled.
 */
export const groupAsCancelablePromise = <TResult extends Array<unknown>>(
  sources: (
    | CancelablePromiseBuildCallback
    | CancelablePromise<TResult>
    | Promise<unknown>
  )[],
  config: CancelablePromiseGroupConfig = {},
): CancelablePromise<TResult> | null => {
  if (!sources.length) return null;

  const {
    maxConcurrent = 8,
    executeInOrder = false,
    beforeEachCallback = null,
    afterEachCallback = null,
    onQueueEmptyCallback = null,
  } = config;

  const queue = [...sources];
  const results: TResult = [] as TResult;

  return new CancelablePromise<TResult>((resolve, _, promiseUtils) => {
    const loadCallbacksBatchAsync = () => {
      if (!queue.length) return;

      // Execute the first batch of callbacks from the queue
      const promises = queue.splice(0, maxConcurrent).map((source) => {
        const result = typeof source === 'function' ? source() : source;

        beforeEachCallback?.();

        const promise = toCancelablePromise(result);

        // Cancel this promise if the group promise is canceled
        const unsubscribeCancel = promiseUtils.onCancel((reason) => {
          promise.cancel(reason);
        });

        promise.then((result) => {
          // Cannot cancel after resolution
          unsubscribeCancel();

          results.push(result as unknown as TResult[0]);

          afterEachCallback?.(result);

          // Report overall progress
          promiseUtils.reportProgress(
            ((results.length ?? 1) / (sources.length ?? 1)) * 100,
          );
        });

        // If executeInOrder is true, wait for each promise before continuing
        return executeInOrder ? promise.then((result) => result) : promise;
      });

      return Promise.all(promises).then(() => {
        // Recursively execute the next batch until queue is empty
        return loadCallbacksBatchAsync();
      });
    };

    loadCallbacksBatchAsync().then(() => {
      onQueueEmptyCallback?.(results);

      // Once the queue is empty, resolve with all results
      resolve(results);
    });
  });
};

export default groupAsCancelablePromise;
