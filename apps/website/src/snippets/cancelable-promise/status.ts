import { CancelablePromise } from 'easy-cancelable-promise';

const wait = (milliseconds: number) =>
  new CancelablePromise<void>((resolve, _reject, { onCancel }) => {
    const timer = setTimeout(resolve, milliseconds);

    onCancel(() => clearTimeout(timer));
  });

export async function statuses() {
  const resolved = wait(10);
  const rejected = new CancelablePromise<void>((_resolve, reject) => reject(new Error('Failed')));
  const canceled = wait(10_000);

  canceled.cancel();

  await rejected.catch(() => {});
  await canceled.catch(() => {});
  await resolved;

  return [resolved.status, rejected.status, canceled.status]; // ['resolved', 'rejected', 'canceled']
}
