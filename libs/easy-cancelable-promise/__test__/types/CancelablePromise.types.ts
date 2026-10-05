import RootDefault, {
  CancelableAbortController,
  CancelablePromise,
  defer,
  groupAsCancelablePromise,
  isCancelableAbortSignal,
  isCancelablePromise,
  isPromise,
  toCancelablePromise,
} from 'easy-cancelable-promise';
import type {
  CancelableAbortSignal,
  CancelablePromiseSettledResult,
  CancelablePromiseUtils,
  DeferredPromise,
  PromiseStatus,
  RejectCallback,
  ResolveCallback,
  Subscription,
} from 'easy-cancelable-promise';
import CancelablePromiseFromSubpath from 'easy-cancelable-promise/CancelablePromise';
import deferFromSubpath from 'easy-cancelable-promise/defer';
import groupFromSubpath from 'easy-cancelable-promise/groupAsCancelablePromise';
import toCancelablePromiseFromSubpath from 'easy-cancelable-promise/toCancelablePromise';
import type { OnProgressCallback } from 'easy-cancelable-promise/types';

/**
 * This file is never executed, it only needs to compile: `yarn test:types`
 */
type Equal<A, B> =
  (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2
    ? true
    : false;

const expectType = <_T extends true>() => {};

// ---- the root entry and the subpaths expose the same declarations

expectType<Equal<typeof RootDefault, typeof CancelablePromise>>();
expectType<
  Equal<typeof CancelablePromiseFromSubpath, typeof CancelablePromise>
>();
expectType<Equal<typeof deferFromSubpath, typeof defer>>();
expectType<Equal<typeof groupFromSubpath, typeof groupAsCancelablePromise>>();
expectType<
  Equal<typeof toCancelablePromiseFromSubpath, typeof toCancelablePromise>
>();

// ---- constructor

const promise = new CancelablePromise<string>((resolve, reject, utils) => {
  expectType<Equal<typeof resolve, ResolveCallback<string>>>();
  expectType<Equal<typeof reject, RejectCallback>>();
  expectType<Equal<typeof utils, CancelablePromiseUtils<string>>>();
  expectType<Equal<ReturnType<typeof utils.onCancel>, Subscription>>();
  expectType<Equal<ReturnType<typeof utils.status>, PromiseStatus>>();

  utils.reportProgress(50, { step: 1 });

  resolve('value');

  // @ts-expect-error the result of this promise is a string
  resolve(1);
});

expectType<Equal<typeof promise.status, PromiseStatus>>();
expectType<Equal<Awaited<typeof promise>, string>>();

// a CancelablePromise is a Promise
const asPromise: Promise<string> = promise;
void asPromise;

// ---- the chain keeps the CancelablePromise type

expectType<
  Equal<ReturnType<typeof promise.cancel>, CancelablePromise<string>>
>();

const mapped = promise.then((value) => value.length);
expectType<Equal<typeof mapped, CancelablePromise<number>>>();

const caught = promise.catch(() => 1);
expectType<Equal<typeof caught, CancelablePromise<string | number>>>();

const settled = promise.finally(() => {});
expectType<Equal<typeof settled, CancelablePromise<string>>>();

promise
  .onCancel((reason) => {
    expectType<Equal<typeof reason, unknown>>();
  })
  .onProgress((progress, metadata) => {
    expectType<Equal<typeof progress, number>>();
    expectType<Equal<typeof metadata, unknown>>();
  })
  .reportProgress(10)
  .cancel('reason');

const onProgress: OnProgressCallback = () => {};
promise.onProgress(onProgress);

// @ts-expect-error the callback is required
promise.onCancel();

// @ts-expect-error the progress is a number
promise.reportProgress('50');

// @ts-expect-error the status is not one of the valid values
promise.status = 'done';

// @ts-expect-error the internal state is private
promise.cancelCallbacks;

// ---- subscriptions with a signal

const controller = new CancelableAbortController();

expectType<Equal<typeof controller.signal, CancelableAbortSignal>>();

promise.onCancel(() => {}, { signal: controller.signal });
promise.onProgress(() => {}, { signal: new AbortController().signal });

// @ts-expect-error the signal is not an AbortSignal
promise.onCancel(() => {}, { signal: 'signal' });

const unsubscribe = controller.signal.subscribe(() => {});
expectType<Equal<typeof unsubscribe, () => void>>();

controller.signal.subscribe('abort', () => {}, { once: true });
controller.dispose();

const signal: AbortSignal = controller.signal;

if (isCancelableAbortSignal(signal)) {
  expectType<Equal<typeof signal, CancelableAbortSignal>>();
}

// ---- statics

expectType<
  Equal<
    ReturnType<typeof CancelablePromise.resolve<number>>,
    CancelablePromise<number>
  >
>();

const resolvedWithoutValue = CancelablePromise.resolve();
expectType<Equal<typeof resolvedWithoutValue, CancelablePromise<void>>>();

const rejected = CancelablePromise.reject('reason');
expectType<Equal<typeof rejected, CancelablePromise<never>>>();

const canceled = CancelablePromise.canceled('reason');
expectType<Equal<typeof canceled, CancelablePromise<never>>>();

const all = CancelablePromise.all([promise, Promise.resolve(1), true] as const);
expectType<Equal<typeof all, CancelablePromise<[string, number, true]>>>();

const allSettled = CancelablePromise.allSettled([promise, 1] as const);
expectType<
  Equal<
    typeof allSettled,
    CancelablePromise<
      [
        CancelablePromiseSettledResult<string>,
        CancelablePromiseSettledResult<1>,
      ]
    >
  >
>();

const race = CancelablePromise.race([promise, Promise.resolve('value')]);
expectType<Equal<typeof race, CancelablePromise<string>>>();

// @ts-expect-error the values should be a collection
CancelablePromise.all(promise);

// ---- defer

const deferred = defer<number>();

expectType<Equal<typeof deferred, DeferredPromise<number>>>();
expectType<Equal<typeof deferred.promise, CancelablePromise<number>>>();

deferred.resolve(1);
deferred.reject(new Error('reason'));
deferred.cancel('reason');

// @ts-expect-error the result of this deferred is a number
deferred.resolve('1');

// ---- guards

const unknownValue: unknown = promise;

if (isCancelablePromise<string>(unknownValue)) {
  expectType<Equal<typeof unknownValue, CancelablePromise<string>>>();
}

if (isPromise(unknownValue)) {
  expectType<Equal<typeof unknownValue, Promise<unknown>>>();
}

// ---- toCancelablePromise

const fromPromise = toCancelablePromise(Promise.resolve(1));
fromPromise.cancel().onCancel(() => {});

const typed = toCancelablePromise<number, number>(1);
expectType<Equal<typeof typed, CancelablePromise<number>>>();

// without type arguments the result is inferred from the source
expectType<Equal<typeof fromPromise, CancelablePromise<number>>>();

fromPromise.then((value) => {
  expectType<Equal<typeof value, number>>();
});

const fromValue = toCancelablePromise('value');
expectType<Equal<typeof fromValue, CancelablePromise<string>>>();

const fromFunction = toCancelablePromise(() => Promise.resolve(true));
expectType<Equal<typeof fromFunction, CancelablePromise<boolean>>>();

const fromCancelable = toCancelablePromise(promise);
expectType<Equal<typeof fromCancelable, CancelablePromise<string>>>();

// ---- allSettled reports the canceled promises

allSettled.then(([first]) => {
  if (first.status === 'fulfilled') {
    expectType<Equal<typeof first.value, string>>();
  } else if (first.status === 'canceled') {
    expectType<Equal<typeof first.reason, unknown>>();
  } else {
    expectType<Equal<typeof first.status, 'rejected'>>();
  }

  // @ts-expect-error the status is not one of the valid values
  if (first.status === 'pending') return;
});

// ---- an async callback is accepted

new CancelablePromise<string>(async (resolve) => {
  resolve(await Promise.resolve('value'));
});

// ---- groupAsCancelablePromise

const group = groupAsCancelablePromise<[number, string]>(
  [() => Promise.resolve(1), Promise.resolve('value')],
  {
    maxConcurrent: 2,
    executeInOrder: true,
    beforeEachCallback: (index) => {
      expectType<Equal<typeof index, number>>();
    },
    afterEachCallback: (result, index) => {
      expectType<Equal<typeof result, unknown>>();
      expectType<Equal<typeof index, number>>();
    },
    onQueueEmptyCallback: () => {},
  },
);

// an empty collection of sources returns null
expectType<Equal<typeof group, CancelablePromise<[number, string]> | null>>();

// @ts-expect-error the limit of concurrent promises is a number
groupAsCancelablePromise([], { maxConcurrent: '2' });

// @ts-expect-error unknown configuration
groupAsCancelablePromise([], { unknownOption: true });
