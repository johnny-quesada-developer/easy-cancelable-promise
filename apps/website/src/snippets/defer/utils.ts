import { defer } from 'easy-cancelable-promise';

export function utils() {
  const deferred = defer<number>();

  const before = [deferred.status(), deferred.isPending(), deferred.isCanceled()];

  // the same utilities the callback of a CancelablePromise receives
  const unsubscribe = deferred.onCancel((reason) => console.log(reason));

  deferred.onProgress((percentage) => console.log(percentage));
  deferred.reportProgress(50);

  unsubscribe();
  deferred.cancel('Not needed');

  return [before, deferred.status(), deferred.promise.status];
  // [['pending', true, false], 'canceled', 'canceled']
}
