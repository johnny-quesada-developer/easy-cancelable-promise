import { groupAsCancelablePromise } from 'easy-cancelable-promise';

export async function errors() {
  const started: string[] = [];

  const task = (name: string, fails = false) => () => {
    started.push(name);

    return fails ? Promise.reject(new Error(`${name} failed`)) : Promise.resolve(name);
  };

  const group = groupAsCancelablePromise<string[]>([task('a'), task('b', true), task('c'), task('d')], {
    maxConcurrent: 2,
  })!;

  // the group rejects with the reason of the first task that failed
  const reason = await group.catch((error) => (error as Error).message);

  return { reason, started, status: group.status };
  // { reason: 'b failed', started: ['a', 'b'], status: 'rejected' }: the tasks in the queue never started
}
