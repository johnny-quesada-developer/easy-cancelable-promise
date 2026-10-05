import { CancelablePromise } from 'easy-cancelable-promise';

export async function executorThrows() {
  const broken = new CancelablePromise<string>(() => {
    throw new Error('Could not start');
  });

  // same as a Promise: the error becomes the rejection
  const reason = await broken.catch((error) => (error as Error).message);

  return [broken.status, reason]; // ['rejected', 'Could not start']
}
