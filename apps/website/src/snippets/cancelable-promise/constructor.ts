import { CancelablePromise } from 'easy-cancelable-promise';

export const task = new CancelablePromise<string>((resolve, reject, utils) => {
  // resolve and reject work as in a Promise
  const timer = setTimeout(() => resolve('Done!'), 1000);

  // onCancel: subscribe to the cancellation. Returns a function that removes the subscription
  const unsubscribe = utils.onCancel((reason) => {
    clearTimeout(timer);
    console.log('Canceled because:', reason);
  });

  // reportProgress: tell the listeners how far the work is
  utils.reportProgress(50, { step: 'halfway' });

  // status, isPending, isCanceled: read the state of the promise
  console.log(utils.status()); // 'pending'
  console.log(utils.isPending()); // true
  console.log(utils.isCanceled()); // false

  // onProgress: listen to the progress from inside
  utils.onProgress((percentage) => console.log(percentage));

  // cancel: cancel the promise from inside
  if (document.hidden) utils.cancel('The page is hidden');

  void unsubscribe;
  void reject;
});
