import { toCancelablePromise } from './toCancelablePromise';
import { CancelablePromise } from './CancelablePromise';

export type TCancelablePromiseBuildCallback<T = unknown> = () =>
  | Promise<T>
  | CancelablePromise<T>;

export type TCancelablePromiseGroupConfig = {
  maxConcurrent?: number;
  executeInOrder?: boolean;
  beforeEachCallback?: () => void;
  afterEachCallback?: (result: unknown) => void;
  onQueueEmptyCallback?: (result: unknown[] | null) => void;
};

/**
 * Group the list of elements into a single CancelablePromise.
 * @param {Array<TCancelablePromiseBuildCallback | TCancelablePromise | Promise<unknown>>} sources the list of elements to group
 * @param {Omit<TAsyncQueueConfig, 'executeImmediately'>} [config] the config to apply to the execution of the group
 * @param {number} [config.maxConcurrent=8] the maximum number of elements to execute concurrently
 * @param {boolean} [config.executeInOrder=false] if true, the elements will be executed in order
 * @param {Function} [config.beforeEachcCallback=null] a callback to execute before each element execution
 * @param {Function} [config.afterEachCallback=null] a callback to execute after each element execution successfully, the callback will receive the result of the element execution unknown
 * @param {Function} [config.onQueueEmptyCallback=null] a callback to execute when the queue is empty, the callback will receive the result of the group execution unknown[][]
 * @returns {TCancelablePromise<TResult>} the CancelablePromise
 * @example
 * const promise1 = new CancelablePromise((resolve) => {
 *  setTimeout(() => {
 *    resolve('hello');
 *  }, 1000);
 * });
 *
 * const promise2 = new CancelablePromise((resolve) => {
 *  setTimeout(() => {
 *    resolve('world');
 *  }, 1000);
 * });
 *
 * const cancelablePromise = groupAsCancelablePromise([promise1, promise2]);
 *
 * cancelablePromise.onCancel(() => {
 *  console.log('promise canceled');
 * });
 *
 * cancelablePromise.cancel();
 * // promise canceled
 * */
export const groupAsCancelablePromise = <TResult extends Array<unknown>>(
  sources: (
    | TCancelablePromiseBuildCallback
    | CancelablePromise<TResult>
    | Promise<unknown>
  )[],
  config: TCancelablePromiseGroupConfig = {},
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

      // we execute the first batch of callbacks in the queue
      const promises = queue.splice(0, maxConcurrent).map((source) => {
        const result = typeof source === 'function' ? source() : source;

        beforeEachCallback?.();

        const promise = toCancelablePromise(result);

        // we cancel the promise if the group promise is canceled
        const unsubscribeCancel = promiseUtils.onCancel((reason) => {
          promise.cancel(reason);
        });

        promise.then((result) => {
          //we cannot cancel the promise after it has been resolved
          unsubscribeCancel();

          results.push(result as unknown as TResult[0]);

          afterEachCallback?.(result);

          promiseUtils.reportProgress(
            ((results.length ?? 1) / (sources.length ?? 1)) * 100,
          );
        });

        // if executeInOrder is true, we wait for the promise to resolve before executing the next callback
        return executeInOrder ? promise.then((result) => result) : promise;
      });

      return Promise.all(promises).then(() => {
        // we execute the next batch of callbacks in the queue recursively until the queue is empty
        return loadCallbacksBatchAsync();
      });
    };

    loadCallbacksBatchAsync().then(() => {
      onQueueEmptyCallback?.(results);

      // once the queue is empty, we return the results of the promises in the queue
      resolve(results);
    });
  });
};
