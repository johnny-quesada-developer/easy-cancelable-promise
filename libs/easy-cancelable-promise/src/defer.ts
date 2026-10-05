import type {
  CancelablePromiseUtils,
  RejectCallback,
  ResolveCallback,
} from './types';

import CancelablePromise from './CancelablePromise';

/** Deferred CancelablePromise with separate control methods. */
export type DeferredPromise<TResult = unknown> = {
  /** The CancelablePromise instance */
  promise: CancelablePromise<TResult>;
  /** Function to resolve the promise */
  resolve: ResolveCallback<TResult>;
  /** Function to reject the promise */
  reject: RejectCallback;
} & CancelablePromiseUtils<TResult>;

/**
 * Creates a deferred CancelablePromise with separate resolve/reject functions.
 *
 * @example
 * ```ts
 * const deferred = defer<string>();
 *
 * // Access the promise
 * deferred.promise.then(console.log);
 *
 * // Resolve from outside
 * deferred.resolve('Success!');
 *
 * // Or reject
 * deferred.reject(new Error('Failed!'));
 *
 * // Or cancel
 * deferred.cancel('Not needed anymore');
 * ```
 */
export const defer = <TResult>(): DeferredPromise<TResult> => {
  let resolve: ResolveCallback<TResult>;
  let reject: RejectCallback;
  let utils: CancelablePromiseUtils<TResult>;

  const promise = new CancelablePromise<TResult>(
    (_resolve, _reject, _utils) => {
      resolve = _resolve;
      reject = _reject;
      utils = _utils;
    },
  );

  return { resolve, reject, ...utils, promise };
};

export default defer;
