import { CancelableAbortController, isCancelableAbortSignal } from 'easy-cancelable-promise';

export function controller() {
  const calls: string[] = [];
  const abortController = new CancelableAbortController();

  // subscribe listens to the abort event and returns the function that removes the listener
  const unsubscribe = abortController.signal.subscribe(() => calls.push('first'));

  abortController.signal.subscribe(() => calls.push('second'));

  const active = abortController.subscriptions.length; // 2

  unsubscribe();

  // abort calls the listeners that are left and then removes them all
  abortController.abort();

  return {
    calls, // ['second']
    active,
    aborted: abortController.signal.aborted, // true
    isCancelable: isCancelableAbortSignal(abortController.signal), // true
    isNativeCancelable: isCancelableAbortSignal(new AbortController().signal), // false
  };
}
