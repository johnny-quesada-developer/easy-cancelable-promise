import { CancelablePromise, defer } from 'easy-cancelable-promise';

export async function settleOnce() {
  const deferred = defer<string>();

  deferred.resolve('first');
  deferred.resolve('second'); // ignored
  deferred.reject(new Error('late')); // ignored
  deferred.cancel(); // ignored: a settled promise cannot be canceled

  const value = await deferred.promise; // 'first'

  // resolving with a promise: the status follows that promise
  const outer = new CancelablePromise<string>((resolve) => {
    resolve(new Promise((done) => setTimeout(() => done('later'), 10)));
  });

  const before = outer.status; // 'pending', it can still be canceled

  await outer;

  return [value, before, outer.status]; // ['first', 'pending', 'resolved']
}
