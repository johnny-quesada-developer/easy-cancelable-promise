import type { CancelableAbortSignal } from './CancelableAbortController';
import type { CancelablePromise } from './CancelablePromise';

// Status of a CancelablePromise.
export type PromiseStatus = 'canceled' | 'pending' | 'resolved' | 'rejected';

// Callback to resolve a promise.
export type ResolveCallback<TResult> = (
  value?: TResult | PromiseLike<TResult>,
) => void;

// Callback to reject a promise.
export type RejectCallback = (reason?: unknown) => void;

// Callback invoked when a promise is canceled.
export type CancelCallback = (reason?: unknown) => void;

/** Parameters for event subscriptions with optional AbortSignal. */
export type SubscriptionParams = {
  // Optional AbortSignal to automatically cleanup subscriptions
  signal?: CancelableAbortSignal | AbortSignal;
};

// Function to unsubscribe from an event.
export type Subscription = () => void;

// Utility functions for CancelablePromise cancellation and progress.
export type CancelablePromiseUtils<TResult = unknown> = {
  /** Cancel the promise with an optional reason */
  cancel: (reason?: unknown) => CancelablePromise<TResult>;
  /** Subscribe to cancellation events */
  onCancel: (callback: CancelCallback) => Subscription;
  // Subscribe to progress update events
  onProgress: (callback: OnProgressCallback) => Subscription;
  // Report progress percentage with optional metadata
  reportProgress: (percentage: number, metadata?: unknown) => void;
  // Get the current promise status
  status: () => PromiseStatus;
  // Check if the promise is canceled
  isCanceled: () => boolean;
  // Check if the promise is pending
  isPending: () => boolean;
};

// Executor function for creating a CancelablePromise.
export type CancelablePromiseCallback<TResult = unknown> = (
  resolve: ResolveCallback<TResult>,
  reject: RejectCallback,
  utils: CancelablePromiseUtils<TResult>,
) => void;

// Callback for progress reporting.
export type OnProgressCallback = (progress: number, metadata?: unknown) => void;
