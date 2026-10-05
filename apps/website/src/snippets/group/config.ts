import { groupAsCancelablePromise } from 'easy-cancelable-promise';

export async function config() {
  const events: string[] = [];
  const step = (name: string) => () => Promise.resolve(name);

  const results = await groupAsCancelablePromise<string[]>([step('a'), step('b'), step('c')], {
    // how many tasks run at the same time (default: 8)
    maxConcurrent: 2,

    // start each task only after the previous one finished (default: false)
    executeInOrder: false,

    // called before each task starts
    beforeEachCallback: () => events.push('starting'),

    // called after each task that succeeded, with its result
    afterEachCallback: (result) => events.push(`finished ${String(result)}`),

    // called once, when every task succeeded, with all the results
    onQueueEmptyCallback: (all) => events.push(`done: ${String(all)}`),
  });

  return { results, events };
  // results: ['a', 'b', 'c']
  // events: ['starting', 'starting', 'finished a', 'finished b', 'starting', 'finished c', 'done: a,b,c']
}
