import { CancelablePromise } from 'easy-cancelable-promise';

const forever = () => new CancelablePromise<void>(() => {});

export async function reasons() {
  // without a reason the promise rejects with new Error('Promise canceled')
  const byDefault = await forever()
    .cancel()
    .catch((reason) => (reason as Error).message);

  // with a reason it rejects with exactly that value
  const custom = await forever()
    .cancel({ code: 'TIMEOUT' })
    .catch((reason) => reason);

  return [byDefault, custom]; // ['Promise canceled', { code: 'TIMEOUT' }]
}
