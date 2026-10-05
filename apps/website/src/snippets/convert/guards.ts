import { CancelablePromise, isCancelablePromise, isPromise, toCancelablePromise } from 'easy-cancelable-promise';

export function describe(value: unknown) {
  if (isCancelablePromise<string>(value)) {
    // value is a CancelablePromise<string> here
    return `cancelable, ${value.status}`;
  }

  if (isPromise(value)) {
    // value is a Promise<unknown> here: anything with a then method
    return 'promise';
  }

  return 'value';
}

export const examples = [
  describe(new CancelablePromise<string>(() => {})), // 'cancelable, pending'
  describe(Promise.resolve()), // 'promise'
  describe({ then: () => {} }), // 'promise'
  describe(42), // 'value'
];

/** Accepts anything and always works with a CancelablePromise. */
export const normalize = (value: unknown) => toCancelablePromise<unknown, unknown>(value);
