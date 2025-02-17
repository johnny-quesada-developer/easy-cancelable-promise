import type { CancelableAbortSignal } from './CancelableAbortController';
import type { CancelablePromise } from './CancelablePromise';

export type TExceptionHandlingType = 'error' | 'warn' | 'ignore';

export type TTryCatchCallbackConfig<TResult = unknown> = {
  exceptionHandlingType?: TExceptionHandlingType;
  defaultResult?: Partial<TResult> | null;
};

export type TTryCatchCallbackPromiseConfig<TResult = unknown> =
  TTryCatchCallbackConfig<TResult> & {
    ignoreCancel?: boolean;
  };

export type TTryCatchResult<TResult = unknown, TError = unknown> = {
  error: TError;
  result: TResult;
};

export type TTryCatchPromiseResult<
  TResult = unknown,
  TError = unknown,
> = Promise<
  TTryCatchResult<TResult, TError> & {
    promise?: CancelablePromise<TResult>;
  }
>;

export type PromiseCanceledResult = {
  status: 'canceled';
  reason?: unknown;
};

export type TPromiseSettledResult<T> =
  | PromiseFulfilledResult<T>
  | PromiseRejectedResult
  | PromiseCanceledResult;

export type TPromiseStatus = 'canceled' | 'pending' | 'resolved' | 'rejected';

export type TResolveCallback<TResult> = (
  value?: TResult | PromiseLike<TResult>,
) => void;

export type TRejectCallback = (reason?: unknown) => void;

export type TCancelCallback = (reason?: unknown) => void;

export type TSubscriptionParams = {
  signal?: CancelableAbortSignal | AbortSignal;
};

export type Subscription = () => void;

export type TCancelablePromiseUtils<TResult = unknown> = {
  cancel: (reason?: unknown) => CancelablePromise<TResult>;
  onCancel: (callback: TCancelCallback) => Subscription;
  onProgress: (callback: TOnProgressCallback) => Subscription;
  reportProgress: (percentage: number, metadata?: unknown) => void;
};

export type TCancelablePromiseCallback<TResult = unknown> = (
  resolve: TResolveCallback<TResult>,
  reject: TRejectCallback,
  utils: TCancelablePromiseUtils<TResult>,
) => void;

/**
 * Callback for the reportProgress event of the promise.
 */
export type TOnProgressCallback = (
  progress: number,
  metadata?: unknown,
) => void;

export type TCancelablePromiseData = Record<string, unknown> & {
  group?: {
    promises: CancelablePromise[];
  };
};
