import { groupAsCancelablePromise } from 'easy-cancelable-promise';

export async function sequential() {
  const order: string[] = [];

  const step = (name: string, milliseconds: number) => () =>
    new Promise<string>((resolve) => {
      order.push(`start ${name}`);

      setTimeout(() => {
        order.push(`end ${name}`);
        resolve(name);
      }, milliseconds);
    });

  // each task starts only after the previous one finished
  const results = await groupAsCancelablePromise<string[]>([step('one', 20), step('two', 5), step('three', 1)], {
    executeInOrder: true,
  });

  return { results, order };
  // results: ['one', 'two', 'three']
  // order: ['start one', 'end one', 'start two', 'end two', 'start three', 'end three']
}
