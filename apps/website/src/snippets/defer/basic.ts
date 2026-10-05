import { defer } from 'easy-cancelable-promise';

export async function basic() {
  const deferred = defer<string>();

  // the promise is here, the controls are separate
  setTimeout(() => deferred.resolve('Hello world!'), 10);

  return deferred.promise; // resolves with 'Hello world!'
}
