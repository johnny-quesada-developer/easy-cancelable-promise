import type {
  Subscription,
  CancelCallback,
  CancelablePromiseCallback,
  CancelablePromiseSettledResult,
  CancelablePromiseUtils,
  OnProgressCallback,
  PromiseStatus,
  RejectCallback,
  ResolveCallback,
  SubscriptionParams,
} from './types';

import isCancelableAbortSignal from './isCancelableAbortSignal';
import isCancelablePromise, { promise_identifier } from './isCancelablePromise';
import isPromise from './isPromise';

/**
 * A Promise that can be canceled with lifecycle and progress tracking.
 *
 * CancelablePromise extends the native Promise with additional capabilities:
 * - Cancellation support via `cancel()` method
 * - Status tracking: 'pending', 'resolved', 'rejected', or 'canceled'
 * - Progress reporting through `reportProgress()` and `onProgress()`
 * - Event subscription for cancellation via `onCancel()`
 *
 * @template TResult - The type of value the promise resolves to
 *
 * @example
 * ```ts
 * const promise = new CancelablePromise((resolve, reject, { onCancel, reportProgress }) => {
 *   const timeoutId = setTimeout(() => resolve('Done!'), 5000);
 *
 *   onCancel(() => {
 *     clearTimeout(timeoutId);
 *     console.log('Canceled!');
 *   });
 *
 *   // Report progress
 *   reportProgress(50);
 * });
 *
 * promise
 *   .then(console.log)
 *   .onProgress((progress) => console.log(`${progress}% complete`))
 *   .onCancel((reason) => console.log('Canceled:', reason));
 *
 * // Cancel after 1 second
 * setTimeout(() => promise.cancel('User canceled'), 1000);
 * ```
 *
 * @example
 * ```ts
 * // Canceling from within the executor
 * const promise = new CancelablePromise((resolve, reject, { cancel }) => {
 *   // Some condition triggers cancellation
 *   if (shouldCancel) {
 *     cancel('Canceled internally');
 *     return;
 *   }
 *   resolve('Success');
 * });
 * ```
 */
export class CancelablePromise<TResult = void> extends Promise<TResult> {
  // Internal identifier used to distinguish CancelablePromise from regular Promise
  // Required because bundlers may polyfill the prototype
  protected [promise_identifier] = true;

  /**
   * The current status of the promise.
   */
  public status: PromiseStatus = 'pending';

  private cancelCallbacks: Set<CancelCallback> = new Set();
  private ownCancelCallbacks: Set<CancelCallback> = new Set();

  private onProgressCallbacks: Set<OnProgressCallback> = new Set();

  // Cleanup all callback sets
  private disposeCallbacks() {
    this.cancelCallbacks = new Set();
    this.ownCancelCallbacks = new Set();
    this.onProgressCallbacks = new Set();
  }

  private _resolve: ResolveCallback<TResult>;
  private _reject: RejectCallback;

  // The reason the promise was canceled with, used to recognize the cancellation in the chained promises
  private cancelReason: unknown;

  constructor(callback: CancelablePromiseCallback<TResult>) {
    let resolve: ResolveCallback<TResult>;
    let reject: RejectCallback;

    // Extract the original Promise callbacks
    super((_resolve, _reject) => {
      resolve = _resolve;
      reject = _reject;
    });

    this._resolve = resolve;
    this._reject = reject;

    // Only the first call to resolve or reject is considered, same as the native Promise
    let isLocked = false;

    const complete = (status: PromiseStatus, settle: () => void) => {
      // the promise could be canceled while it was waiting for a promise used as result
      if (this.status !== 'pending') return;

      this.status = status;
      this.disposeCallbacks();

      settle();
    };

    const resolveCallback: ResolveCallback<TResult> = (value) => {
      if (isLocked || this.status !== 'pending') return;

      isLocked = true;

      if (!isPromise(value)) {
        complete('resolved', () => this._resolve(value));

        return;
      }

      // canceling this promise also cancels the CancelablePromise it was resolved with, a native promise cannot be canceled
      if (isCancelablePromise(value)) {
        this.subscribeToOwnCancelEvent((reason) => {
          value.cancel(reason);
        });
      }

      // the status follows the promise used as result, the promise is still pending until then
      value.then(
        (result) =>
          complete('resolved', () => this._resolve(result as TResult)),
        (reason) => complete('rejected', () => this._reject(reason)),
      );
    };

    const rejectCallback: RejectCallback = (reason) => {
      if (isLocked || this.status !== 'pending') return;

      isLocked = true;

      complete('rejected', () => this._reject(reason));
    };

    const utils: CancelablePromiseUtils<TResult> = {
      cancel: (reason) => {
        return this.cancel(reason);
      },
      onCancel: (callback) => {
        return this.subscribeToOwnCancelEvent(callback);
      },
      onProgress: (callback) => {
        this.onProgress(callback);

        return () => {
          this.onProgressCallbacks.delete(callback);
        };
      },
      reportProgress: (percentage, metadata) => {
        this.reportProgress(percentage, metadata);
      },
      status: () => {
        return this.status;
      },
      isCanceled: () => {
        return this.status === 'canceled';
      },
      isPending: () => {
        return this.status === 'pending';
      },
    };

    // Execute the custom callback with cancelable utilities
    try {
      const result: unknown = callback(resolveCallback, rejectCallback, utils);

      // an async callback does not throw, it returns a promise that rejects
      if (isPromise(result)) result.then(undefined, rejectCallback);
    } catch (error) {
      // a callback that throws rejects the promise, same as the native Promise
      rejectCallback(error);
    }

    // Override the then method to return a CancelablePromise.
    // We need to override this here to avoid the bundler to polyfill the Promise.
    this.then = <TResult1 = TResult, TResult2 = never>(
      onfulfilled?:
        | ((value: TResult) => TResult1 | PromiseLike<TResult1>)
        | undefined
        | null,
      onrejected?:
        | ((reason: unknown) => TResult2 | PromiseLike<TResult2>)
        | undefined
        | null,
    ): CancelablePromise<TResult1 | TResult2> => {
      const { promise, resolve, reject } = this.createChildPromise<
        TResult1 | TResult2
      >();

      super.then(onfulfilled, onrejected).then(resolve, reject);

      return promise;
    };

    // Override the catch method to return a CancelablePromise.
    // We need to override this here to avoid the bundler to polyfill the Promise.
    this.catch = <T = unknown>(
      onrejected?: (reason: unknown) => T | PromiseLike<T>,
    ): CancelablePromise<T | TResult> => {
      const { promise, resolve, reject } = this.createChildPromise<
        T | TResult
      >();

      super.catch(onrejected).then(resolve, reject);

      return promise;
    };

    // Override the finally method to return a CancelablePromise.
    this.finally = (onfinally?: () => void): CancelablePromise<TResult> => {
      const { promise, resolve, reject } = this.createChildPromise<TResult>();

      super.finally(onfinally).then(resolve, reject);

      return promise;
    };
  }

  // Subscribe to the cancel event of the promise.
  // @param {CancelCallback} callback the callback to be called when the promise is canceled
  private subscribeToOwnCancelEvent(callback: CancelCallback): Subscription {
    this.ownCancelCallbacks.add(callback);

    return () => {
      this.ownCancelCallbacks.delete(callback);
    };
  }

  /**
   * Cancel the promise and all the chained promises.
   * @param {unknown} [reason] the reason of the cancellation
   * @returns {CancelablePromise} the promise itself
   * */
  public cancel(reason?: unknown): CancelablePromise<TResult> {
    // we cannot cancel promises that are completed
    if (this.status !== 'pending') return this;

    // whoever cancels a promise does not have to catch its rejection
    this.catch(() => {});

    this.cancelWith(
      reason === undefined ? new Error('Promise canceled') : reason,
    );

    return this;
  }

  /**
   * Moves the promise to the canceled status: calls the cancel callbacks and rejects it with the reason.
   * The rejection is a normal one, a promise without a handler for it reports an unhandled rejection.
   */
  private cancelWith(reason: unknown) {
    this.status = 'canceled';
    this.cancelReason = reason;

    // a callback that throws should not prevent the cancellation of the promise
    const errors: unknown[] = [];

    const execute = (callback: CancelCallback) => {
      try {
        callback(reason);
      } catch (error) {
        errors.push(error);
      }
    };

    // the own promise cancel callbacks are called first
    this.ownCancelCallbacks.forEach(execute);

    // then the promise cancel second level subscribers
    this.cancelCallbacks.forEach(execute);

    this._reject(reason);

    this.disposeCallbacks();

    // the first error is reported once the promise is canceled
    if (errors.length) throw errors[0];
  }

  /**
   * Subscribe to the cancel event of the promise.
   * @param {CancelCallback} [callback] the callback to be called when the promise is canceled
   * @returns {CancelablePromise} the promise itself
   * */
  public onCancel(
    callback: CancelCallback,
    { signal }: SubscriptionParams = {},
  ): CancelablePromise<TResult> {
    this.cancelCallbacks.add(callback);

    if (isCancelableAbortSignal(signal)) {
      signal.subscribe(() => {
        this.cancelCallbacks.delete(callback);
      });
    } else {
      signal?.addEventListener('abort', () => {
        this.cancelCallbacks.delete(callback);
      });
    }

    return this;
  }

  /**
   * This method allows to report the progress across the chain of promises.
   * */
  public onProgress(
    callback: OnProgressCallback,
    { signal }: SubscriptionParams = {},
  ): CancelablePromise<TResult> {
    this.onProgressCallbacks.add(callback);

    if (isCancelableAbortSignal(signal)) {
      signal.subscribe(() => {
        this.onProgressCallbacks.delete(callback);
      });
    } else {
      signal?.addEventListener('abort', () => {
        this.onProgressCallbacks.delete(callback);
      });
    }

    return this;
  }

  /**
   * This allows to report progress across the chain of promises,
   * this is useful when you have an async operation that could take a long time and you want to report the progress to the user.
   */
  public reportProgress(percentage: number, metadata?: unknown) {
    this.onProgressCallbacks.forEach((callback) =>
      callback(percentage, metadata),
    );

    return this;
  }

  // Returns a Promise that resolves or rejects as soon as the previous promise is resolved or rejected,
  // with cancelable promise you can call the cancel method on the child promise to cancel all the parent promises.
  // inherits the onProgressCallbacks array from the parent promise to the child promise so the progress can be reported across the chain
  private createChildPromise<TResult1>() {
    let resolve: ResolveCallback<TResult1>;
    let reject: RejectCallback;

    const promise = new CancelablePromise<TResult1>((_resolve, _reject) => {
      resolve = _resolve;
      reject = _reject;
    });

    // share the reference of the onProgressCallbacks array between the promises so the progress can be reported
    promise.onProgressCallbacks = this.onProgressCallbacks;

    // cancels the parent promise when the child promise is canceled
    promise.onCancel((reason) => {
      this.cancel(reason);
    });

    // A promise chained from a canceled promise is canceled too.
    // If a handler of the chain dealt with the cancellation the chained promise follows that handler instead.
    // Nobody called cancel on the chained promise, so its rejection has to be handled like any other.
    const rejectOrCancel: RejectCallback = (reason) => {
      if (this.status === 'canceled' && reason === this.cancelReason) {
        promise.cancelWith(reason);

        return;
      }

      reject(reason);
    };

    return {
      promise,
      resolve,
      reject: rejectOrCancel,
    };
  }

  /**
   * Returns a Promise that resolves or rejects as soon as the previous promise is resolved or rejected,
   * with cancelable promise you can call the cancel method on the child promise to cancel all the parent promises.
   * @param {((value: TResult) => TResult1 | PromiseLike<TResult1>) | undefined | null} [onfulfilled] the callback to be called when the promise is resolved
   * @param {((reason: unknown) => TResult2 | PromiseLike<TResult2>) | undefined | null} [onrejected] the callback to be called when the promise is rejected
   * @returns {CancelablePromise<TResult1 | TResult2>} the cancelable promise
   * @example
   * const promise = new CancelablePromise((resolve, reject, utils) => {
   *  setTimeout(() => {
   *   resolve('resolved');
   *  }, 1000);
   * });
   *
   * const childPromise = promise.then((value) => {
   *  console.log(value); // 'resolved'
   * });
   *
   * childPromise.cancel();
   * console.log(childPromise.status); // 'canceled'
   * console.log(promise.status); // 'canceled'
   */
  public then: <TResult1 = TResult, TResult2 = never>(
    onfulfilled?:
      | ((value: TResult) => TResult1 | PromiseLike<TResult1>)
      | undefined
      | null,
    onrejected?:
      | ((reason: unknown) => TResult2 | PromiseLike<TResult2>)
      | undefined
      | null,
  ) => CancelablePromise<TResult1 | TResult2>;

  /**
   * Returns a Promise that resolves when the previous promise is rejected,
   * with cancelable promise you can call the cancel method on the child promise to cancel all the parent promises.
   * @param {((reason: any) => T | PromiseLike<T>) | undefined | null} [onrejected] the callback to be called when the promise is rejected
   * @returns {CancelablePromise<T>} the cancelable promise
   * @example
   * const promise = new CancelablePromise((resolve, reject, utils) => {
   *  setTimeout(() => {
   *    reject('rejected');
   *  }, 1000);
   * });
   *
   * const childPromise = promise.catch(() => {
   *  console.log(childPromise.status); // 'canceled'
   *  console.log(promise.status); // 'canceled'
   * });
   *
   * childPromise.cancel();
   * */
  public catch: <T = unknown>(
    onrejected?: (reason: unknown) => T | PromiseLike<T>,
  ) => CancelablePromise<TResult | T>;

  /**
   * Subscribe a callback to be called when the promise is resolved or rejected,
   */
  public finally: (
    onfinally?: (() => void) | undefined | null,
  ) => CancelablePromise<TResult>;

  /**
   * Statics
   */

  public static resolve(): CancelablePromise<void>;

  public static resolve<TResult>(
    value: TResult,
  ): CancelablePromise<Awaited<TResult>>;

  public static resolve<TResult>(
    value: TResult | PromiseLike<TResult>,
  ): CancelablePromise<Awaited<TResult>>;

  static resolve<TResult>(
    value?: TResult,
  ): CancelablePromise<Awaited<TResult>> {
    return new CancelablePromise<Awaited<TResult>>((resolve) =>
      resolve(value as Awaited<TResult>),
    );
  }

  public static reject = (reason?: unknown): CancelablePromise<never> => {
    return new CancelablePromise((_, reject) => reject(reason));
  };

  /**
   * Returns a Promise object with status 'canceled'.
   */
  public static canceled = (reason?: unknown): CancelablePromise<never> => {
    return new CancelablePromise((_, __, { cancel }) => cancel(reason));
  };

  /**
   * Creates a Promise that is resolved or rejected when any of the provided Promises are resolved or rejected.
   * If the race is canceled, all the promises are canceled.
   */
  public static race = <TResult>(
    values: Array<TResult | PromiseLike<TResult> | CancelablePromise<TResult>>,
  ): CancelablePromise<Awaited<TResult>> => {
    return new CancelablePromise<Awaited<TResult>>(
      (resolve, reject, { onCancel, cancel: parentCancel }) => {
        values.forEach((promise) => {
          const cancelable = toCancelablePromise<unknown, Awaited<TResult>>(
            promise,
          );

          onCancel((reason) => {
            cancelable.cancel(reason);
          });

          cancelable.then(resolve, (reason) => {
            if (cancelable.status === 'canceled') {
              // cancel parent promise
              parentCancel(reason);

              return;
            }

            reject(reason);
          });
        });
      },
    );
  };

  /**
   * Creates a Promise that is resolved with an array of results when all of the provided Promises resolve, or rejected when any Promise is rejected.
   * If the all is canceled, all the promises are canceled.
   */
  public static all = <TSource extends readonly unknown[] | []>(
    values: TSource,
  ): CancelablePromise<{
    -readonly [P in keyof TSource]: Awaited<TSource[P]>;
  }> => {
    type Result = {
      -readonly [P in keyof TSource]: Awaited<TSource[P]>;
    };

    return new CancelablePromise<Result>(
      (resolve, reject, { onCancel, cancel: parentCancel }) => {
        // the results are stored by position, the same promise can be more than once in the values
        const results: unknown[] = new Array(values.length).fill(null);
        const promisesLength = values.length;
        let resultsLength = 0;

        // same as the native Promise.all
        if (!promisesLength) return resolve(results as Result);

        values.forEach((promise, index) => {
          const cancelable = toCancelablePromise<unknown, unknown>(promise);

          onCancel((reason) => {
            cancelable.cancel(reason);
          });

          cancelable.then(
            (result) => {
              resultsLength++;
              results[index] = result;

              const isAllResolved = resultsLength === promisesLength;

              if (!isAllResolved) return;

              resolve(results as Result);
            },
            (reason) => {
              if (cancelable.status === 'canceled') {
                // cancel parent promise
                parentCancel(reason);

                return;
              }

              reject(reason);
            },
          );
        });
      },
    );
  };

  /**
   * Creates a Promise that is resolved with an array of results when all
   * of the provided Promises resolve or reject.
   * If the allSettled is canceled, all the promises are canceled.
   * @param values An array of Promises.
   * @returns A new Promise.
   */
  static allSettled<TResult extends readonly unknown[] | []>(
    values: TResult,
  ): CancelablePromise<{
    -readonly [P in keyof TResult]: CancelablePromiseSettledResult<
      Awaited<TResult[P]>
    >;
  }>;

  // Keeps the static side of the class compatible with the one of Promise, calls resolve to the signature above
  static allSettled<TResult extends readonly unknown[] | []>(
    values: TResult,
  ): CancelablePromise<{
    -readonly [P in keyof TResult]: PromiseSettledResult<Awaited<TResult[P]>>;
  }>;

  static allSettled<TResult extends readonly unknown[] | []>(
    values: TResult,
  ): unknown {
    type Result = {
      -readonly [P in keyof TResult]: CancelablePromiseSettledResult<
        Awaited<TResult[P]>
      >;
    };

    return new CancelablePromise<Result>((resolve, _, { onCancel }) => {
      // the results are stored by position, the same promise can be more than once in the values
      const results: CancelablePromiseSettledResult<unknown>[] = new Array(
        values.length,
      ).fill(null);

      const promisesLength = values.length;
      let resultsLength = 0;

      // same as the native Promise.allSettled
      if (!promisesLength) return resolve(results as Result);

      values.forEach((value, index) => {
        const cancelable = toCancelablePromise<unknown, unknown>(value);

        onCancel((reason) => {
          cancelable.cancel(reason);
        });

        cancelable
          .then(
            (result) => {
              results[index] = {
                status: 'fulfilled',
                value: result,
              };
            },
            (reason) => {
              results[index] = {
                status:
                  cancelable.status === 'canceled' ? 'canceled' : 'rejected',
                reason,
              };
            },
          )
          .finally(() => {
            resultsLength++;

            const isAllResolved = resultsLength === promisesLength;

            if (!isAllResolved) return;

            resolve(results as Result);
          });
      });
    });
  }
}

/**
 * The constructor of the cancelable promise should be the same as the Promise constructor
 */
CancelablePromise.prototype.constructor = Promise;

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
export const toCancelablePromise = <
  T = unknown,
  // the result of the promise, of the value, or of what the function returns
  TResult = T extends (...args: never[]) => infer TReturn
    ? Awaited<TReturn>
    : Awaited<T>,
>(
  source: T,
): CancelablePromise<TResult> => {
  if (isCancelablePromise(source)) return source as CancelablePromise<TResult>;

  if (typeof source === 'function') {
    return toCancelablePromise(source()) as CancelablePromise<TResult>;
  }

  if (!isPromise(source)) {
    return new CancelablePromise<TResult>((resolve) =>
      resolve(source as unknown as TResult),
    );
  }

  let resolve: ResolveCallback<TResult>;
  let reject: RejectCallback;

  const cancelable = new CancelablePromise<TResult>((_resolve, _reject) => {
    resolve = _resolve;
    reject = _reject;

    source.then(
      resolve as (value: unknown) => void | PromiseLike<void>,
      reject,
    );
  });

  cancelable.onCancel((reason) => {
    reject(reason);
  });

  return cancelable;
};

export default CancelablePromise;
