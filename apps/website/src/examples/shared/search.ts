import { CancelablePromise } from 'easy-cancelable-promise';
import { primesInStep, type SearchOptions } from './work';

/**
 * The search in a native promise. Once it starts nothing can stop it:
 * whoever asked for the result can stop listening, but every step still runs.
 */
export function searchWithNativePromise({ from = 0, steps, pause, onStep }: SearchOptions): Promise<number> {
  return new Promise<number>((resolve) => {
    let step = 0;
    let found = 0;

    const next = () => {
      found += primesInStep(from + step);
      step += 1;

      onStep?.({ step, steps, found });

      if (step === steps) return resolve(found);

      setTimeout(next, pause);
    };

    setTimeout(next, pause);
  });
}

/**
 * The same search in a CancelablePromise. The promise owns its cleanup:
 * canceling it clears the timer, so the next step never runs. It also reports its progress.
 */
export function searchWithCancelablePromise({ from = 0, steps, pause, onStep }: SearchOptions): CancelablePromise<number> {
  return new CancelablePromise<number>((resolve, _reject, { onCancel, reportProgress }) => {
    let step = 0;
    let found = 0;
    let timer: ReturnType<typeof setTimeout>;

    onCancel(() => clearTimeout(timer));

    const next = () => {
      found += primesInStep(from + step);
      step += 1;

      onStep?.({ step, steps, found });
      reportProgress((step / steps) * 100, { step, steps, found });

      if (step === steps) return resolve(found);

      timer = setTimeout(next, pause);
    };

    timer = setTimeout(next, pause);
  });
}
