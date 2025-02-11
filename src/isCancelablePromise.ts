import type { CancelablePromise } from './CancelablePromise';

export const promise_identifier = Symbol('promise_identifier');

export const isCancelablePromise = <TResult>(
  source: unknown,
): source is CancelablePromise<TResult> => {
  return !!source?.[promise_identifier];
};
