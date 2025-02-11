import type { TTryCatchCallbackConfig, TTryCatchResult } from './types';

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
export const tryCatch = <
  TError,
  TFunction extends () => unknown,
  TResult = ReturnType<TFunction>,
>(
  callback: TFunction,
  config: TTryCatchCallbackConfig<TResult> = {},
): TTryCatchResult<TResult, TError> => {
  const { defaultResult: errorResult = null, exceptionHandlingType = 'error' } =
    config;

  try {
    const result = callback() as TResult;

    return {
      error: null,
      result,
    };
  } catch (error) {
    if (exceptionHandlingType !== 'ignore') {
      console[exceptionHandlingType](error);
    }

    return {
      error: error as TError,
      result: errorResult as TResult,
    };
  }
};
