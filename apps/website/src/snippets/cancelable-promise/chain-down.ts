import { CancelablePromise } from 'easy-cancelable-promise';

export async function chainDown() {
  const source = new CancelablePromise<number>(() => {});

  // no handler for the cancellation: these promises are canceled with their source
  const doubled = source.then((value) => value * 2);
  const text = doubled.then((value) => `The answer is ${value}`);

  // a handler that deals with the cancellation: this promise follows the handler
  const recovered = source.catch(() => 0);

  source.cancel('Not needed');

  const value = await recovered; // 0

  await text.catch(() => {});

  return [doubled.status, text.status, recovered.status, value];
  // ['canceled', 'canceled', 'resolved', 0]
}
