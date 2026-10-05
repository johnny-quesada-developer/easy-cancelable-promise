import { defer } from 'easy-cancelable-promise';
import type { CancelablePromise } from 'easy-cancelable-promise';

/** The code under test receives the promise, so a test can hand it one it controls. */
const describeRequest = async (request: CancelablePromise<string>) => {
  try {
    return `Loaded ${await request}`;
  } catch {
    return request.status === 'canceled' ? 'Canceled' : 'Failed';
  }
};

describe('describeRequest', () => {
  it('describes each way a request can end', async () => {
    const loaded = defer<string>();
    const failed = defer<string>();
    const canceled = defer<string>();

    loaded.resolve('user');
    failed.reject(new Error('500'));
    canceled.cancel();

    expect(await describeRequest(loaded.promise)).toBe('Loaded user');
    expect(await describeRequest(failed.promise)).toBe('Failed');
    expect(await describeRequest(canceled.promise)).toBe('Canceled');
  });

  it('receives the progress the test reports', () => {
    const request = defer<string>();
    const onProgress = vi.fn();

    request.promise.onProgress(onProgress);
    request.reportProgress(40, { loaded: 4 });

    expect(onProgress).toHaveBeenCalledWith(40, { loaded: 4 });
  });
});
