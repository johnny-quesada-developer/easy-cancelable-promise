import { CancelableAbortController, CancelablePromise } from 'easy-cancelable-promise';

export function mounted() {
  const calls: string[] = [];
  const task = new CancelablePromise<void>(() => {});

  // one controller for everything a screen subscribes to
  const screen = new CancelableAbortController();

  task.onCancel(() => calls.push('update the screen'), { signal: screen.signal });
  task.onProgress(() => calls.push('move the progress bar'), { signal: screen.signal });

  // a native AbortSignal works too
  const native = new AbortController();

  task.onCancel(() => calls.push('native listener'), { signal: native.signal });

  // the screen is gone: remove its listeners, the task keeps running
  screen.abort();
  native.abort();

  task.reportProgress(50);
  task.cancel();

  return [calls, task.status]; // [[], 'canceled']
}
