import { CancelablePromise } from 'easy-cancelable-promise';

export interface User {
  id: number;
  name: string;
}

export const fetchUser = (id: number) =>
  new CancelablePromise<User>((resolve, reject, { onCancel }) => {
    const controller = new AbortController();

    // canceling the promise aborts the request
    onCancel(() => controller.abort());

    fetch(`/api/users/${id}`, { signal: controller.signal })
      .then((response) => response.json() as Promise<User>)
      .then(resolve, reject);
  });

const request = fetchUser(1);

// the user navigated away
request.cancel('User navigated away');
