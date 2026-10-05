import type { CancelablePromise } from 'easy-cancelable-promise';

class TimeoutError extends Error {}

export async function load(request: CancelablePromise<string>) {
  try {
    return await request;
  } catch (reason) {
    // reasons are typed unknown: narrow them before use
    if (reason instanceof TimeoutError) return 'Took too long';
    if (reason instanceof Error) return reason.message;

    return String(reason);
  }
}

export { TimeoutError };
