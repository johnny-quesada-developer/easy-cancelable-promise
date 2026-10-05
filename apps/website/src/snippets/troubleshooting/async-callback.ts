import { CancelablePromise } from 'easy-cancelable-promise';

export const load = (url: string) =>
  new CancelablePromise<unknown>(async (resolve, _reject, { onCancel }) => {
    const controller = new AbortController();

    onCancel(() => controller.abort());

    // if fetch or json throws, the promise is rejected with that error
    const response = await fetch(url, { signal: controller.signal });

    resolve(await response.json());
  });
