import { CancelablePromise } from 'easy-cancelable-promise';

// If you know this...
const native = new Promise((resolve, reject) => {
  // ...
});

// You know this!
const cancelable = new CancelablePromise((resolve, reject, { onCancel }) => {
  // ...
});
