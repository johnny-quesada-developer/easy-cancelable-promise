import { CancelablePromise, groupAsCancelablePromise } from 'easy-cancelable-promise';

export async function cancelGroup() {
  const started: number[] = [];
  const stopped: number[] = [];

  const task = (id: number) => () => {
    started.push(id);

    return new CancelablePromise<number>((resolve, _reject, { onCancel }) => {
      const timer = setTimeout(() => resolve(id), 5000);

      onCancel(() => {
        clearTimeout(timer);
        stopped.push(id);
      });
    });
  };

  const group = groupAsCancelablePromise<number[]>([task(1), task(2), task(3), task(4)], { maxConcurrent: 2 })!;

  // one call: the running tasks are canceled, the tasks in the queue never start
  group.cancel('User navigated away');

  const reason = await group.catch((error) => error);

  return { started, stopped, reason, status: group.status };
  // { started: [1, 2], stopped: [1, 2], reason: 'User navigated away', status: 'canceled' }
}
