import type { CancelableAbortSignal } from './CancelableAbortController';

/**
 * Checks if an AbortSignal is a CancelableAbortSignal.
 */
export const isCancelableAbortSignal = (
  value: CancelableAbortSignal | AbortSignal,
): value is CancelableAbortSignal => {
  return Boolean(
    (value as CancelableAbortSignal)?.__is_cancelable_abort_signal,
  );
};

export default isCancelableAbortSignal;
