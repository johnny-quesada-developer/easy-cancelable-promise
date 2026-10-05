import { CancelablePromise } from 'easy-cancelable-promise';

const fetchUser = new CancelablePromise(
  async (resolve, reject, { onCancel }) => {
    const controller = new AbortController();

    onCancel(() => controller.abort());

    const user = await fetch('/api/user', { signal: controller.signal }).then(
      (res) => res.json(),
    );

    resolve(user);
  },
);

// User navigated? Just cancel it.
fetchUser.cancel('User navigated away');
