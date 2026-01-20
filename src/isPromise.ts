/**
 * Checks if the value is a Promise
 * @param {unknown} value the value to check
 * @returns {value is Promise<unknown>} true if the value is a Promise, false otherwise
 */
export const isPromise = <T>(value: unknown): value is Promise<T> => {
  return Promise.resolve(value) === value;
};

export default isPromise;
