import { CancelablePromise } from 'easy-cancelable-promise';

export const countdown = (seconds: number) =>
  new CancelablePromise<string>((resolve, _reject, { onCancel }) => {
    const timer = setTimeout(() => resolve('Done!'), seconds * 1000);

    onCancel(() => clearTimeout(timer));
  });

const task = countdown(5);

task.onCancel((reason) => console.log('Canceled because:', reason));
task.cancel('No longer needed');

console.log(task.status); // 'canceled'
