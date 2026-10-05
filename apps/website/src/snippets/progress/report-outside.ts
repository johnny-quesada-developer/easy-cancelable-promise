import { defer } from 'easy-cancelable-promise';

export function reportFromOutside() {
  const updates: number[] = [];
  const deferred = defer<string>();

  deferred.promise.onProgress((percentage) => updates.push(percentage));

  // reportProgress is also a method of the promise and of the deferred object
  deferred.promise.reportProgress(30);
  deferred.reportProgress(60);
  deferred.resolve('Done!');

  return updates; // [30, 60]
}
