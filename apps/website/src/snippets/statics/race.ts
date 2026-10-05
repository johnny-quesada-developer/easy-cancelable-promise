import { CancelablePromise } from 'easy-cancelable-promise';

const wait = <T>(value: T, milliseconds: number) =>
  new CancelablePromise<T>((resolve, _reject, { onCancel }) => {
    const timer = setTimeout(() => resolve(value), milliseconds);

    onCancel(() => clearTimeout(timer));
  });

export async function race() {
  const fast = wait('fast', 10);
  const slow = wait('slow', 5000);

  const winner = await CancelablePromise.race([fast, slow]);

  // the race is over, but the slow promise is still running: cancel what you no longer need
  slow.cancel();

  return [winner, slow.status]; // ['fast', 'canceled']
}
