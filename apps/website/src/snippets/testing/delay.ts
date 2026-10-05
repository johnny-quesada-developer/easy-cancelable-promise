import { CancelablePromise } from 'easy-cancelable-promise';

/** Resolves with the value after the delay. Canceling it clears the timer. */
export const delay = <T>(value: T, milliseconds: number) =>
  new CancelablePromise<T>((resolve, _reject, { onCancel }) => {
    const timer = setTimeout(() => resolve(value), milliseconds);

    onCancel(() => clearTimeout(timer));
  });
