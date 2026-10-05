import { CancelablePromise } from 'easy-cancelable-promise';

export const withTimeout = (url: string, milliseconds: number) =>
  new CancelablePromise<Response>((resolve, reject, { cancel, onCancel }) => {
    const controller = new AbortController();

    // the promise cancels itself when the request takes too long
    const timer = setTimeout(() => cancel('Request timeout'), milliseconds);

    onCancel(() => {
      clearTimeout(timer);
      controller.abort();
    });

    fetch(url, { signal: controller.signal })
      .then(resolve, reject)
      .finally(() => clearTimeout(timer));
  });
