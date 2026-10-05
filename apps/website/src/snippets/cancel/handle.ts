import type { CancelablePromise } from 'easy-cancelable-promise';

export async function load<T>(request: CancelablePromise<T>): Promise<T | null> {
  try {
    return await request;
  } catch (error) {
    // a cancellation is not a failure: the status tells them apart
    if (request.status === 'canceled') return null;

    throw error;
  }
}
