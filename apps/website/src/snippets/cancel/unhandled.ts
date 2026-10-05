import { CancelablePromise } from 'easy-cancelable-promise';

const task = new CancelablePromise<void>(() => {});

// no catch needed: canceling a promise never causes an unhandled rejection
task.cancel();

// promises chained from it still reject, so handle the ones you create
task.then(() => console.log('never runs')).catch(() => {});
