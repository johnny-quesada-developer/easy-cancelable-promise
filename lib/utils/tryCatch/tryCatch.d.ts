import { CancelablePromise } from '../../CancelablePromise';
import { TTryCatchCallbackConfig, TTryCatchCallbackPromiseConfig, TTryCatchPromiseResult, TTryCatchResult } from './tryCatch.types';
/**
 * Try to execute a callback and catch any error.
 * @param {TFunction} callback the callback to be executed
 * @param {TTryCatchCallbackConfig} config parameters to configure the execution
 * @returns {TTryCatchResult} the result of the execution
 * @template TError the type of the error
 * @template TFunction the type of the callback
 * @template TResult the type of the result
 * @example const { error, result } = tryCatch(() => {
 *  throw new Error('Error');
 * });
 * console.log(error); // Error: Error
 * console.log(result); // null
 * @example const { error, result } = tryCatch(() => {
 * return 'result';
 * });
 * console.log(error); // null
 * console.log(result); // result
 * */
export declare const tryCatch: <TError, TFunction extends () => unknown, TResult = ReturnType<TFunction>>(callback: TFunction, config?: TTryCatchCallbackConfig<TResult>) => TTryCatchResult<TResult, TError>;
/**
 * try to execute an async callback and catch any error.
 * @param {TError} error the type of error that the promise will throw if rejected
 * @param {TSource} source the callback or promise to be handled
 * @param {TTryCatchCallbackPromiseConfig} config parameters to configure the execution
 * @param {boolean} config.ignoreCancel if true, the error will be ignored log if the promise is canceled, default true
 * @param {TResult} config.defaultResult the default result if the promise is rejected, to avoid null or undefined on result property
 * @param {TExceptionHandlingType} config.exceptionHandlingType the type of log to be used when the promise is rejected, default 'error' and ignore for cancelled promise
 * @returns {TTryCatchPromiseResult} the result of the execution
 * @template TError the type of the error
 * @template TSource the type of the callback or promise
 * @template TResult the type of the result, depends on the type of the callback or promise
 * @example
 * const { error, result, promise } = await tryCatchPromise(async () => {
 *  throw new Error('Error');
 * });
 *
 * console.log(error); // Error: Error
 * console.log(result); // null
 * console.log(promise); // CancelablePromise {status: "rejected", value: Error: Error}
 *
 * @example const { error, result, promise } = await tryCatchPromise(async () => {
 *  return 'result';
 * });
 *
 * console.log(error); // null
 * console.log(result); // result
 * console.log(promise); // CancelablePromise {status: "resolved", value: "result"}
 *
 * @example
 * const promise = new CancelablePromise((resolve, reject) => {
 *  setTimeout(() => {
 *    reject(new Error('Error'));
 *  }, 1000);
 * });
 *
 * const { error, result, promise: { status } } = await tryCatchPromise(promise);
 *
 * console.log(error); // Error: Error
 * console.log(result); // null
 * console.log(status); // rejected
 */
export declare const tryCatchPromise: <TError, TSource extends CancelablePromise<void> | (() => CancelablePromise | Promise<unknown> | unknown), TResult = Awaited<TSource extends CancelablePromise<void> ? TSource : ReturnType<TSource extends Function ? TSource : never>>>(source: TSource, config?: TTryCatchCallbackPromiseConfig<TResult>) => TTryCatchPromiseResult<TResult, TError>;
