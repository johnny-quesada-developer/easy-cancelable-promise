import { CancelablePromise } from 'easy-cancelable-promise';

export const load = (url: string) =>
  new CancelablePromise<unknown>(async (resolve, reject, { onCancel }) => {
    const controller = new AbortController();

    onCancel(() => controller.abort());

    try {
      const response = await fetch(url, { signal: controller.signal });

      resolve(await response.json());
    } catch (error) {
      // without this, the error would be lost and the promise would stay pending
      reject(error);
    }
  });
