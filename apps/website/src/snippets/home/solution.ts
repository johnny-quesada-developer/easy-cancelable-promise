import { CancelablePromise } from 'easy-cancelable-promise';

const fetchUser = new CancelablePromise(
  async (resolve, reject, { onCancel }) => {
    const controller = new AbortController();

    onCancel(() => controller.abort());

    const response = await fetch('/api/user', { signal: controller.signal });

    resolve(await response.json());
  },
);

// User navigated? Just cancel it.
fetchUser.cancel('User navigated away');
