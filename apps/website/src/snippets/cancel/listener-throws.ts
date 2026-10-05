import { CancelablePromise } from 'easy-cancelable-promise';

export function listenerThrows() {
  const calls: string[] = [];

  const task = new CancelablePromise<void>(() => {})
    .onCancel(() => {
      throw new Error('This listener failed');
    })
    .onCancel(() => calls.push('still called'));

  try {
    task.cancel();
  } catch (error) {
    // the first error is thrown by cancel, after the promise is canceled
    calls.push((error as Error).message);
  }

  return [task.status, ...calls]; // ['canceled', 'still called', 'This listener failed']
}
