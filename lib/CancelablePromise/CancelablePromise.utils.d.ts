import { TTryCatchPromiseResult } from '../utils';
import { CancelablePromise, TDecoupledCancelablePromise, TCancelablePromiseGroupConfig, TCancelablePromiseBuildCallback } from './CancelablePromise';
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
export declare const createDecoupledPromise: <TResult>() => TDecoupledCancelablePromise<TResult>;
/**
 * Convert a value to a CancelablePromise, the value can be a Promise/CancellablePromise or a value.
 * @param {unknown} source the value to convert
 * @returns {TCancelablePromise<T>} the CancelablePromise
 * @example
 * const promise = new Promise((resolve) => {
 * setTimeout(() => {
 * resolve('hello world');
 * }, 1000);
 * });
 * const cancelablePromise = toCancelablePromise(promise);
 * cancelablePromise.onCancel(() => {
 * console.log('promise canceled');
 * });
 * cancelablePromise.cancel();
 * // promise canceled
 * */
export declare const toCancelablePromise: <T = unknown, TResult = T extends Promise<unknown> ? CancelablePromise<Awaited<T>> : CancelablePromise<T>>(source: T) => CancelablePromise<TResult>;
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
export declare const groupAsCancelablePromise: <TResult extends unknown[]>(sources: (Promise<unknown> | TCancelablePromiseBuildCallback<unknown> | CancelablePromise<TResult>)[], config?: TCancelablePromiseGroupConfig) => CancelablePromise<TResult>;
/**
 * Checks if the value is a Promise
 * @param {unknown} value the value to check
 * @returns {value is Promise<unknown>} true if the value is a Promise, false otherwise
 */
export declare const isPromise: (value: unknown) => value is Promise<unknown>;
/**
 * Execute the list of promises in order and return the result of each promise execution.
 * This method is similar to Promise.allSettled but it allows to cancel the execution of the promises.
 * Also groups the results as an array of TTryCatchPromiseResult<PromiseSettledResult<Awaited<T[P]>>>.
 */
export declare const allSettledCancelable: <T extends [] | readonly unknown[]>(values: T) => CancelablePromise<{ -readonly [P in keyof T]: TTryCatchPromiseResult<PromiseSettledResult<Awaited<T[P]>>, unknown>; }>;
