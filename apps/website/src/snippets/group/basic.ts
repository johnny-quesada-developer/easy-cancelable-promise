import { CancelablePromise, groupAsCancelablePromise } from 'easy-cancelable-promise';

const fetchUser = (id: number) =>
  new CancelablePromise<string>((resolve, _reject, { onCancel }) => {
    const timer = setTimeout(() => resolve(`user ${id}`), 10);

    onCancel(() => clearTimeout(timer));
  });

export async function basic() {
  // functions are called when their turn arrives; promises are already running
  const group = groupAsCancelablePromise<string[]>(
    [() => fetchUser(1), () => fetchUser(2), () => fetchUser(3), () => fetchUser(4), () => fetchUser(5)],
    { maxConcurrent: 2 }, // only 2 at a time
  );

  // an empty list returns null
  if (!group) return [];

  group.onProgress((percentage) => console.log(`${percentage}% complete`)); // 20, 40, 60, 80, 100

  return group; // ['user 1', 'user 2', 'user 3', 'user 4', 'user 5'], in the order of the tasks
}
