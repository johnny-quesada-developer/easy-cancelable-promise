import { CancelablePromise, CancelableAbortController } from 'easy-cancelable-promise';

export function unsubscribe() {
  const calls: string[] = [];

  const download = new CancelablePromise<void>((_resolve, _reject, { onCancel }) => {
    // inside the promise, onCancel returns the function that removes the listener
    const removeFirst = onCancel(() => calls.push('abort the request'));

    // the request is over: there is nothing to abort any more
    removeFirst();

    onCancel(() => calls.push('delete the temporary file'));
  });

  // outside, a listener is removed with a signal
  const controller = new CancelableAbortController();

  download.onCancel(() => calls.push('removed before the cancellation'), { signal: controller.signal });

  controller.abort();
  download.cancel();

  return calls; // ['delete the temporary file']
}
