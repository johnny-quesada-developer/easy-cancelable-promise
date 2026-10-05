import { CancelablePromise } from 'easy-cancelable-promise';

/** To stop the work itself, connect the cancellation to whatever can stop it. */
export const cancelableFetch = (input: RequestInfo | URL, init: RequestInit = {}) =>
  new CancelablePromise<Response>((resolve, reject, { onCancel }) => {
    const controller = new AbortController();

    onCancel(() => controller.abort());

    fetch(input, { ...init, signal: controller.signal }).then(resolve, reject);
  });
