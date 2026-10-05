import { CancelablePromise } from 'easy-cancelable-promise';

export function listen() {
  const calls: string[] = [];

  const task = new CancelablePromise<void>((_resolve, _reject, { onCancel }) => {
    // listeners of the promise itself run first
    onCancel(() => calls.push('inside'));
  });

  // any number of listeners can be added from outside, and they can be chained
  task
    .onCancel((reason) => calls.push(`outside: ${String(reason)}`))
    .onCancel(() => calls.push('analytics'));

  task.cancel('User closed the dialog');

  return calls; // ['inside', 'outside: User closed the dialog', 'analytics']
}
