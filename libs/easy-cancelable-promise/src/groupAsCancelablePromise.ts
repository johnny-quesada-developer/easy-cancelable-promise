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

  const queue = sources.map((source, index) => ({ source, index }));
  const results: TResult = [] as TResult;
  let resultsLength = 0;

  // executeInOrder: each source starts when the previous one is completed
  // a batch needs at least one source, otherwise the queue would never be consumed
  const batchSize = executeInOrder ? 1 : Math.max(1, maxConcurrent);

  return new CancelablePromise<TResult>((resolve, reject, promiseUtils) => {
    const loadCallbacksBatchAsync = () => {
      // the group does not start more sources once it is rejected or canceled
      if (!queue.length || !promiseUtils.isPending()) return;

      // Execute the first batch of callbacks from the queue
      const promises = queue.splice(0, batchSize).map(({ source, index }) => {
        beforeEachCallback?.();

        const result = typeof source === 'function' ? source() : source;

        const promise = toCancelablePromise(result);

        // Cancel this promise if the group promise is canceled
        const unsubscribeCancel = promiseUtils.onCancel((reason) => {
          promise.cancel(reason);
        });

        return promise.then(
          (result) => {
            // Cannot cancel after resolution
            unsubscribeCancel();

            // the results keep the position of their sources
            results[index] = result as unknown as TResult[number];
            resultsLength++;

            afterEachCallback?.(result);

            // Report overall progress
            promiseUtils.reportProgress((resultsLength / sources.length) * 100);
          },
          (reason) => {
            unsubscribeCancel();

            if (promise.status === 'canceled') {
              // a canceled source cancels the group, same as CancelablePromise.all
              promiseUtils.cancel(reason);

              return;
            }

            reject(reason);
          },
        );
      });

      return Promise.all(promises).then(() => {
        // Recursively execute the next batch until queue is empty
        return loadCallbacksBatchAsync();
      });
    };

    loadCallbacksBatchAsync().then(() => {
      // one of the sources was rejected or canceled
      if (!promiseUtils.isPending()) return;

      onQueueEmptyCallback?.(results);

      // Once the queue is empty, resolve with all results
      resolve(results);
    }, reject);
  });
};

export default groupAsCancelablePromise;
