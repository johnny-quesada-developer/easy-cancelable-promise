import { CancelablePromise } from 'easy-cancelable-promise';

export const wait = (milliseconds: number) =>
  new CancelablePromise<string>((resolve, _reject, { onCancel }) => {
    const timer = setTimeout(() => resolve('Done!'), milliseconds);

    // runs only if the promise is canceled: this is where the work is stopped
    onCancel(() => clearTimeout(timer));
  });
