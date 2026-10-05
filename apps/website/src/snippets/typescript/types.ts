import { CancelablePromise } from 'easy-cancelable-promise';
import type {
  CancelablePromiseCallback,
  CancelablePromiseUtils,
  CancelCallback,
  OnProgressCallback,
  PromiseStatus,
  RejectCallback,
  ResolveCallback,
  Subscription,
  SubscriptionParams,
} from 'easy-cancelable-promise';

// the callback of the constructor, written on its own
const callback: CancelablePromiseCallback<number> = (
  resolve: ResolveCallback<number>,
  reject: RejectCallback,
  utils: CancelablePromiseUtils<number>,
) => {
  const unsubscribe: Subscription = utils.onCancel(() => reject(new Error('Stopped')));

  resolve(1);
  unsubscribe();
};

const onCancel: CancelCallback = (reason) => console.log(reason);
const onProgress: OnProgressCallback = (progress, metadata) => console.log(progress, metadata);
const options: SubscriptionParams = { signal: new AbortController().signal };

const promise = new CancelablePromise(callback).onCancel(onCancel, options).onProgress(onProgress, options);

export const status: PromiseStatus = promise.status; // 'pending' | 'resolved' | 'rejected' | 'canceled'
