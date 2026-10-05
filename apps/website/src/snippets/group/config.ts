import { groupAsCancelablePromise } from 'easy-cancelable-promise';

export async function config() {
  const events: string[] = [];
  const step = (name: string) => () => Promise.resolve(name);

  const results = await groupAsCancelablePromise<string[]>([step('a'), step('b'), step('c')], {
    // how many tasks run at the same time (default: 8)
    maxConcurrent: 2,

    // start each task only after the previous one finished (default: false)
    executeInOrder: false,

    // called before each task starts, with the position of the task
    beforeEachCallback: (index) => events.push(`starting ${index}`),

    // called after each task that succeeded, with its result and its position
    afterEachCallback: (result, index) => events.push(`finished ${index}: ${String(result)}`),

    // called once, when every task succeeded, with all the results
    onQueueEmptyCallback: (all) => events.push(`done: ${String(all)}`),
  });

  return { results, events };
  // results: ['a', 'b', 'c']
  // events: ['starting 0', 'starting 1', 'finished 0: a', 'finished 1: b', 'starting 2', 'finished 2: c', 'done: a,b,c']
}
