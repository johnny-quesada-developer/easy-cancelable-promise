import { CancelableAbortSignal } from './CancelableAbortController';
export type PromiseCanceledResult = {
    status: 'canceled';
    reason?: unknown;
};
export type TPromiseSettledResult<T> = PromiseFulfilledResult<T> | PromiseRejectedResult | PromiseCanceledResult;
export type TPromiseStatus = 'canceled' | 'pending' | 'resolved' | 'rejected';
export type TResolveCallback<TResult> = (value?: TResult | PromiseLike<TResult>) => void;
export type TRejectCallback = (reason?: unknown) => void;
export type TCancelCallback = (reason?: unknown) => void;
export type TSubscriptionParams = {
    signal?: CancelableAbortSignal;
};
export type Subscription = () => void;
export type TCancelablePromiseUtils<TResult = unknown> = {
    cancel: (reason?: unknown) => CancelablePromise<TResult>;
    onCancel: (callback: TCancelCallback) => Subscription;
    onProgress: (callback: TOnProgressCallback) => Subscription;
    reportProgress: (percentage: number, metadata?: unknown) => void;
};
export type TCancelablePromiseCallback<TResult = unknown> = (resolve: TResolveCallback<TResult>, reject: TRejectCallback, utils: TCancelablePromiseUtils<TResult>) => void;
/**
 * Callback for the reportProgress event of the promise.
 */
export type TOnProgressCallback = (progress: number, metadata?: unknown) => void;
export type TCancelablePromiseBuildCallback<T = unknown> = () => Promise<T> | CancelablePromise<T>;
export type TCancelablePromiseData = Record<string, unknown> & {
    group?: {
        promises: CancelablePromise[];
    };
};
export type TDecoupledCancelablePromise<TResult = unknown> = {
    promise: CancelablePromise<TResult>;
    resolve: TResolveCallback<TResult>;
    reject: TRejectCallback;
} & TCancelablePromiseUtils<TResult>;
export type TCancelablePromiseGroupConfig = {
    maxConcurrent?: number;
    executeInOrder?: boolean;
    beforeEachCallback?: () => void;
    afterEachCallback?: (result: unknown) => void;
    onQueueEmptyCallback?: (result: unknown[] | null) => void;
};
/**
 * CancelablePromise is a Promise that can be canceled.
 * It is a Promise that has a status property that can be 'pending', 'resolved', 'rejected' or 'canceled'.
 * It has an onCancel method that allows to register a callback that will be called when the promise is canceled.
 * It has a cancel method that allows to cancel the promise.
 * @param {TCancelablePromiseCallback<TResult>} [callback] the callback of the promise, it will receive the resolve, reject and cancel functions
 * @param {TCancelablePromiseData<TMetadata>} [data] the data of the promise
 * @constructor
 * @example
 * const promise = new CancelablePromise((resolve, reject, utils) => {
 *   resolve('resolved');
 * });
 *
 * promise.then((value) => {
 *  console.log(value); // 'resolved'
 * });
 *
 * @example
 * const promise = new CancelablePromise((resolve, reject, utils) => {
 *  utils.cancel('canceled');
 * });
 *
 * promise.catch((reason) => {
 * console.log(reason); // 'canceled'
 * console.log(promise.status); // 'canceled'
 * });
 */
export declare class CancelablePromise<TResult = void> extends Promise<TResult> {
    /**
     * The status of the promise.
     */
    status: TPromiseStatus;
    private cancelCallbacks;
    private ownCancelCallbacks;
    /**
     * The callbacks to be called when reportProgress is called.
     */
    private onProgressCallbacks;
    private disposeCallbacks;
    /**
     * Resolve the promise.
     * @param {TResult} [value] the value of the resolution
     * */
    private _resolve;
    /**
     * Cancel the promise.
     * @param {unknown} [reason] the reason of the cancellation
     * */
    private _reject;
    constructor(callback: TCancelablePromiseCallback<TResult>);
    /**
     * Subscribe to the cancel event of the promise.
     * @param {TCancelCallback} callback the callback to be called when the promise is canceled
     * */
    private subscribeToOwnCancelEvent;
    /**
     * Cancel the promise and all the chained promises.
     * @param {unknown} [reason] the reason of the cancellation
     * @returns {CancelablePromise} the promise itself
     * */
    cancel: (reason?: unknown) => CancelablePromise<TResult>;
    /**
     * Subscribe to the cancel event of the promise.
     * @param {TCancellablePromiseCallback} [callback] the callback to be called when the promise is canceled
     * @returns {CancelablePromise} the promise itself
     * */
    onCancel: (callback: TCancelCallback, { signal }?: TSubscriptionParams) => CancelablePromise<TResult>;
    /**
     * This method allows to report the progress across the chain of promises.
     * */
    onProgress: (callback: TOnProgressCallback, { signal }?: TSubscriptionParams) => CancelablePromise<TResult>;
    /**
     * This allows to report progress across the chain of promises,
     * this is useful when you have an async operation that could take a long time and you want to report the progress to the user.
     */
    reportProgress: (percentage: number, metadata?: unknown) => this;
    /**
     * Returns a Promise that resolves or rejects as soon as the previous promise is resolved or rejected,
     * with cancelable promise you can call the cancel method on the child promise to cancel all the parent promises.
     * inherits the onProgressCallbacks array from the parent promise to the child promise so the progress can be reported across the chain
     */
    private createChildPromise;
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
    then: <TResult1 = TResult, TResult2 = never>(onfulfilled?: ((value: TResult) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | undefined | null) => CancelablePromise<TResult1 | TResult2>;
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
    catch: <T = unknown>(onrejected?: (reason: any) => T | PromiseLike<T>) => CancelablePromise<TResult | T>;
    /**
     * Subscribe a callback to be called when the promise is resolved or rejected,
     */
    finally: (onfinally?: (() => void) | undefined | null) => CancelablePromise<TResult>;
    /**
     * Statics
     */
    static resolve(): CancelablePromise<void>;
    static resolve<TResult>(value: TResult): CancelablePromise<Awaited<TResult>>;
    static resolve<TResult>(value: TResult | PromiseLike<TResult>): CancelablePromise<Awaited<TResult>>;
    static reject: (reason?: unknown) => CancelablePromise<never>;
    /**
     * Returns a Promise object with status 'canceled'.
     */
    static canceled: (reason?: unknown) => CancelablePromise<never>;
    /**
     * Creates a Promise that is resolved or rejected when any of the provided Promises are resolved or rejected.
     * If the race is canceled, all the promises are canceled.
     */
    static race: <TResult_1>(values: (TResult_1 | PromiseLike<TResult_1> | CancelablePromise<TResult_1>)[]) => CancelablePromise<Awaited<TResult_1>>;
    /**
     * Creates a Promise that is resolved with an array of results when all of the provided Promises resolve, or rejected when any Promise is rejected.
     * If the all is canceled, all the promises are canceled.
     */
    static all: <TSource extends [] | readonly unknown[]>(values: TSource) => CancelablePromise<{ -readonly [P in keyof TSource]: Awaited<TSource[P]>; }>;
    /**
     * Creates a Promise that is resolved with an array of results when all
     * of the provided Promises resolve or reject.
     * If the allSettled is canceled, all the promises are canceled.
     * @param values An array of Promises.
     * @returns A new Promise.
     */
    static allSettled: <TResult_1 extends [] | readonly unknown[]>(values: TResult_1) => CancelablePromise<{ -readonly [P in keyof TResult_1]: PromiseSettledResult<Awaited<TResult_1[P]>>; }>;
}
