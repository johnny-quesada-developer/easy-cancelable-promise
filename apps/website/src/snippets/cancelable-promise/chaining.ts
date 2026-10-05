import { CancelablePromise } from 'easy-cancelable-promise';

export function chain() {
  let stopped = false;

  const source = new CancelablePromise<number>((resolve, _reject, { onCancel }) => {
    const timer = setTimeout(() => resolve(21), 5000);

    onCancel(() => {
      clearTimeout(timer);
      stopped = true;
    });
  });

  // then, catch and finally return a CancelablePromise
  const doubled = source.then((value) => value * 2);
  const text = doubled.then((value) => `The answer is ${value}`);

  // canceling the last promise of a chain cancels every promise before it
  text.cancel('Not needed');

  return {
    source: source.status, // 'canceled'
    doubled: doubled.status, // 'canceled'
    text: text.status, // 'canceled'
    stopped, // true: the timer of the first promise was cleared
    last: text.catch((reason) => reason), // resolves with 'Not needed'
  };
}
