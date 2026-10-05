import type { CancelablePromise } from './CancelablePromise';

// Internal symbol for identifying CancelablePromise instances
// Registered globally so the promises are recognized across copies of the package (ESM and CommonJS builds)
export const promise_identifier = Symbol.for(
  'easy-cancelable-promise.promise_identifier',
);

/**
 * Checks if a value is a CancelablePromise.
 */
export function isCancelablePromise<TResult>(
  source: unknown,
): source is CancelablePromise<TResult> {
  return !!source?.[promise_identifier];
}

export default isCancelablePromise;
