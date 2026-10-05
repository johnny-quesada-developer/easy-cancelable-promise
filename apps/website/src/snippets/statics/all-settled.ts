import { CancelablePromise } from 'easy-cancelable-promise';

export async function allSettled() {
  const canceled = new CancelablePromise<string>(() => {});

  canceled.cancel('Not needed');

  const results = await CancelablePromise.allSettled([
    CancelablePromise.resolve('ok'),
    CancelablePromise.reject(new Error('failed')),
    canceled,
  ]);

  // a canceled promise is reported with the status 'canceled'.
  // The type only knows 'fulfilled' and 'rejected', so compare it as a string.
  return results.map((result) => result.status as string); // ['fulfilled', 'rejected', 'canceled']
}
