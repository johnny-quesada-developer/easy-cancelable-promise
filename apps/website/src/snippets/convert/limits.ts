import { toCancelablePromise } from 'easy-cancelable-promise';

export async function limits() {
  let finished = false;

  const native = new Promise<string>((resolve) =>
    setTimeout(() => {
      finished = true;
      resolve('The work was done anyway');
    }, 20),
  );

  const cancelable = toCancelablePromise<Promise<string>, string>(native);

  // the wrapper is canceled: whoever awaits it stops waiting
  cancelable.cancel('Not needed');

  await cancelable.catch(() => {});
  await native;

  // the native promise had no way to stop, so its work ran to the end
  return [cancelable.status, finished]; // ['canceled', true]
}
