import { CancelablePromise } from 'easy-cancelable-promise';

const task = new CancelablePromise<void>(() => {});

// no catch needed: canceling a promise never causes an unhandled rejection
task.cancel();

// the promises chained from it are canceled too, and need no catch either
const next = task.then(() => console.log('never runs'));

console.log(next.status); // 'pending' now, 'canceled' once the cancellation reaches it
