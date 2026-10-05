import { CancelableAbortController } from 'easy-cancelable-promise';

export function dispose() {
  const calls: string[] = [];
  const controller = new CancelableAbortController();

  controller.signal.subscribe(() => calls.push('never called'));

  // dispose removes the listeners without aborting the signal
  controller.dispose();

  let error = '';

  try {
    controller.signal.subscribe(() => {});
  } catch (reason) {
    error = (reason as Error).message;
  }

  return [calls, controller.signal.aborted, error];
  // [[], false, 'AbortController was already aborted or disposed.']
}
