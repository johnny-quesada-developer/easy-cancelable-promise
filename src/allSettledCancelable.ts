import type { TTryCatchPromiseResult } from './types';

import { tryCatchPromise } from './tryCatchPromise';
import { CancelablePromise } from './CancelablePromise';
import { groupAsCancelablePromise } from './groupAsCancelablePromise';
import { toCancelablePromise } from './toCancelablePromise';

/**
 * Execute the list of promises in order and return the result of each promise execution.
 * This method is similar to Promise.allSettled but it allows to cancel the execution of the promises.
 * Also groups the results as an array of TTryCatchPromiseResult<PromiseSettledResult<Awaited<T[P]>>>.
 */
export const allSettledCancelable = <T extends readonly unknown[] | []>(
  values: T,
): CancelablePromise<{
  -readonly [P in keyof T]: TTryCatchPromiseResult<
    PromiseSettledResult<Awaited<T[P]>>
  >;
}> => {
  const cancellables: CancelablePromise<unknown>[] = [];

  const promises = values.map((source) => {
    const promise: CancelablePromise<unknown> = toCancelablePromise(source);

    cancellables.push(promise);

    return tryCatchPromise(() => promise).then(({ error, result }) => ({
      error,
      result,
      promise,
    }));
  });

  const group = groupAsCancelablePromise(cancellables);

  return new CancelablePromise(async (resolve, _, tools) => {
    // allow to cancel the group of promises when the allSettled promise is canceled
    const unsubscribeCancel = tools.onCancel(group.cancel);

    // wait for all the promises to be settled no matter if they are resolved or rejected
    const result = await Promise.all(promises);

    // we cannot cancel the group of promises after they have been resolved
    unsubscribeCancel();

    // return the tryCatchPromise results
    resolve(result as any);
  });
};

export default allSettledCancelable;
