import { CancelablePromise } from 'easy-cancelable-promise';

export async function shortcuts() {
  const resolved = CancelablePromise.resolve('value');
  const rejected = CancelablePromise.reject(new Error('reason'));
  const canceled = CancelablePromise.canceled('reason');

  await rejected.catch(() => {});

  return [resolved.status, rejected.status, canceled.status]; // ['resolved', 'rejected', 'canceled']
}
