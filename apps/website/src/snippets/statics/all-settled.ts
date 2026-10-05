import { CancelablePromise } from 'easy-cancelable-promise';

export async function allSettled() {
  const canceled = new CancelablePromise<string>(() => {});

  canceled.cancel('Not needed');

  const results = await CancelablePromise.allSettled([
    CancelablePromise.resolve('ok'),
    CancelablePromise.reject(new Error('failed')),
    canceled,
  ]);

  // besides 'fulfilled' and 'rejected', a canceled promise is reported with the status 'canceled'
  return results.map((result) => result.status); // ['fulfilled', 'rejected', 'canceled']
}
