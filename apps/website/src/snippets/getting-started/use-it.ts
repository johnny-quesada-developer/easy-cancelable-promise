import { wait } from './first-promise';

export async function example() {
  // it is a Promise: await it, chain it, pass it to anything that takes a promise
  const result = await wait(100);

  console.log(result); // 'Done!'

  const pending = wait(5000);

  console.log(pending.status); // 'pending'

  pending.cancel('No longer needed');

  console.log(pending.status); // 'canceled'

  // a canceled promise rejects with the reason of the cancellation
  await pending.catch((reason) => {
    console.log(reason); // 'No longer needed'
  });

  return result;
}
