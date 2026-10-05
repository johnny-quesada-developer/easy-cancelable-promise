import { CancelablePromise } from 'easy-cancelable-promise';

const wait = <T>(value: T, milliseconds: number) =>
  new CancelablePromise<T>((resolve, _reject, { onCancel }) => {
    const timer = setTimeout(() => resolve(value), milliseconds);

    onCancel(() => clearTimeout(timer));
  });

export async function all() {
  // promises, cancelable promises and plain values, in any mix
  const results = await CancelablePromise.all([wait('user', 20), Promise.resolve(42), true]);

  return results; // ['user', 42, true], in the order of the values
}

export function cancelAll() {
  const first = wait('first', 5000);
  const second = wait('second', 5000);
  const both = CancelablePromise.all([first, second]);

  // canceling the result cancels every promise inside it
  both.cancel('Not needed');

  return [first.status, second.status, both.status]; // ['canceled', 'canceled', 'canceled']
}

export function oneIsCanceled() {
  const first = wait('first', 5000);
  const second = wait('second', 5000);
  const both = CancelablePromise.all([first, second]);

  // canceling one of the promises cancels the result, and with it the rest
  first.cancel('Not needed');

  return both.catch(() => [first.status, second.status, both.status]);
  // resolves with ['canceled', 'canceled', 'canceled']
}
