import type {
  TCancelablePromiseUtils,
  TRejectCallback,
  TResolveCallback,
} from './types';

import { CancelablePromise } from './CancelablePromise';

export type TDecoupledCancelablePromise<TResult = unknown> = {
  promise: CancelablePromise<TResult>;
  resolve: TResolveCallback<TResult>;
  reject: TRejectCallback;
} & TCancelablePromiseUtils<TResult>;

/**
 * Create a decoupled promise.
 * @param {TCreateCancelablePromiseConfig} [callback] the callback of the promise
 * @returns {TDecoupledCancelablePromise} the decoupled promise
 * @returns {TDecoupledCancelablePromise.promise} A CancelablePromise
 * @returns {TDecoupledCancelablePromise.resolve} A function to resolve the promise
 * @returns {TDecoupledCancelablePromise.reject} A function to reject the promise
 * @returns {TDecoupledCancelablePromise.cancel} A function to cancel the promise
 * @returns {TDecoupledCancelablePromise.onCancel} A function to subscribe to the cancel event of the promise
 * @example
 * const { promise, resolve } = createDecoupledPromise();
 *
 * promise.then((result) => {
 *  console.log(result);
 * });
 *
 * resolve('hello world');
 * // hello world
 */
export const createDecoupledPromise = <
  TResult,
>(): TDecoupledCancelablePromise<TResult> => {
  let resolve: TResolveCallback<TResult>;
  let reject: TRejectCallback;
  let utils: TCancelablePromiseUtils<TResult>;

  const promise = new CancelablePromise<TResult>(
    (_resolve, _reject, _utils) => {
      resolve = _resolve;
      reject = _reject;
      utils = _utils;
    },
  );

  return { resolve, reject, ...utils, promise };
};
