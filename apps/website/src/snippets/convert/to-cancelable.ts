import { CancelablePromise, toCancelablePromise } from 'easy-cancelable-promise';

export async function convert() {
  // from a native promise
  const fromPromise = toCancelablePromise<Promise<number>, number>(Promise.resolve(1));

  // from a plain value
  const fromValue = toCancelablePromise<number, number>(2);

  // from a function: it is called, and its result is converted
  const fromFunction = toCancelablePromise<() => Promise<number>, number>(() => Promise.resolve(3));

  // a CancelablePromise is returned as it is
  const original = new CancelablePromise<number>((resolve) => resolve(4));
  const same = toCancelablePromise<CancelablePromise<number>, number>(original);

  return {
    values: await Promise.all([fromPromise, fromValue, fromFunction, same]), // [1, 2, 3, 4]
    sameInstance: same === original, // true
  };
}
