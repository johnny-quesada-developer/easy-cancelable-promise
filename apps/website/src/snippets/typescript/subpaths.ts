// every module is also an entry of the package
import CancelablePromise from 'easy-cancelable-promise/CancelablePromise';
import { defer, type DeferredPromise } from 'easy-cancelable-promise/defer';
import { groupAsCancelablePromise } from 'easy-cancelable-promise/groupAsCancelablePromise';
import { toCancelablePromise } from 'easy-cancelable-promise/toCancelablePromise';
import { isCancelablePromise } from 'easy-cancelable-promise/isCancelablePromise';
import { isPromise } from 'easy-cancelable-promise/isPromise';
import { CancelableAbortController } from 'easy-cancelable-promise/CancelableAbortController';
import { isCancelableAbortSignal } from 'easy-cancelable-promise/isCancelableAbortSignal';
import type { PromiseStatus } from 'easy-cancelable-promise/types';

const deferred: DeferredPromise<number> = defer<number>();

// the class is the same one in every entry
export const sameClass = deferred.promise instanceof CancelablePromise; // true

export const status: PromiseStatus = deferred.promise.status;

export {
  groupAsCancelablePromise,
  toCancelablePromise,
  isCancelablePromise,
  isPromise,
  CancelableAbortController,
  isCancelableAbortSignal,
};
