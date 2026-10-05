import { CancelablePromise } from 'easy-cancelable-promise';

const task = new CancelablePromise<void>(() => {});

// no catch needed: canceling a promise never causes an unhandled rejection
task.cancel();

// a promise chained from it is canceled too, but nobody called cancel on that one:
// it rejects like any other promise, so handle the chains you create
task.then(() => console.log('never runs')).catch(() => {});
