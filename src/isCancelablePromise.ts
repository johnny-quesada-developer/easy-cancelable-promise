import type { CancelablePromise } from './CancelablePromise';

// Internal symbol for identifying CancelablePromise instances
export const promise_identifier = Symbol('promise_identifier');

/**
 * Checks if a value is a CancelablePromise.
 */
export function isCancelablePromise<TResult>(
  source: unknown,
): source is CancelablePromise<TResult> {
  return !!source?.[promise_identifier];
}

export default isCancelablePromise;
