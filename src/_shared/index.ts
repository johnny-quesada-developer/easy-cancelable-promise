export const promise_identifier = Symbol('promise_identifier');

export const isCancelablePromise = (source: unknown): boolean => {
  return !!source?.[promise_identifier];
};
