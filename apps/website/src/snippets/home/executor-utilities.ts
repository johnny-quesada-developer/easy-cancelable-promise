import { CancelablePromise } from 'easy-cancelable-promise';

new CancelablePromise(
  (
    resolve,
    reject,
    { cancel, onCancel, reportProgress, status, isCanceled, isPending },
  ) => {
    // ✅ cancel: Cancel from inside
    cancel('Internal cancellation');

    // ✅ onCancel: Subscribe to cancellation
    const cleanup = onCancel((reason) => {
      console.log('Canceled:', reason);
    });

    // ✅ reportProgress: Report progress
    reportProgress(50); // 50% complete

    // ✅ status: Get current status
    console.log(status()); // 'pending'

    // ✅ isCanceled: Check if canceled
    if (isCanceled()) return;

    // ✅ isPending: Check if still pending
    if (isPending()) {
      // Continue work
    }
  },
);
