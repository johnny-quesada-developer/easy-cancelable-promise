import { useEffect, useRef, useState } from 'react';
import type { CancelablePromise } from 'easy-cancelable-promise';
import '../shared/demo.css';
import { createLog } from '../shared/log';
import { count, milliseconds } from '../shared/format';
import { DEFAULT_DURATION, DURATIONS, type Duration } from '../shared/durations';
import { searchWithCancelablePromise, searchWithNativePromise } from '../shared/search';
import { useElapsed } from '../shared/useElapsed';

type Status = 'idle' | 'running' | 'still running' | 'finished' | 'resolved' | 'canceled';

interface Side {
  status: Status;
  step: number;
  found: number;
  /** Steps that ran after Stop was pressed. */
  afterStop: number;
  /** Time between Stop and the last step that ran after it, in milliseconds. 0 when no step ran. */
  wasted: number;
}

const log = createLog();

export const STEPS = 40;

const idle: Side = { status: 'idle', step: 0, found: 0, afterStop: 0, wasted: 0 };

export function CancelDemo() {
  const [duration, setDuration] = useState<Duration>(DEFAULT_DURATION);
  const [native, setNative] = useState<Side>(idle);
  const [cancelable, setCancelable] = useState<Side>(idle);
  const [running, setRunning] = useState(false);
  const { elapsed, start: startClock, stop: stopClock } = useElapsed();

  const task = useRef<CancelablePromise<number> | null>(null);
  const stoppedAt = useRef<number | null>(null);
  const pending = useRef(0);

  useEffect(
    () => () => {
      task.current?.cancel('The example was closed');
    },
    [],
  );

  const settle = () => {
    pending.current -= 1;

    if (pending.current > 0) return;

    setRunning(false);
    stopClock();
  };

  const start = () => {
    const pause = (duration * 1000) / STEPS;

    stoppedAt.current = null;
    pending.current = 2;

    setRunning(true);
    setNative({ ...idle, status: 'running' });
    setCancelable({ ...idle, status: 'running' });
    startClock();
    log.write(`started · ${STEPS} steps in ${duration} s, in a Promise and in a CancelablePromise`);

    // Measured when the step runs, not when React applies the update: a step that ran right before
    // Stop must not be counted as one that ran after it.
    const measure = (set: typeof setNative) => ({ step, found }: { step: number; found: number }) => {
      const sinceStop = stoppedAt.current === null ? null : performance.now() - stoppedAt.current;

      set((current) => ({
        ...current,
        step,
        found,
        afterStop: current.afterStop + (sinceStop === null ? 0 : 1),
        wasted: sinceStop ?? current.wasted,
      }));
    };

    // a native promise: Stop can only stop listening, the steps keep running
    searchWithNativePromise({
      steps: STEPS,
      pause,
      onStep: measure(setNative),
    }).then((found) => {
      setNative((current) => ({ ...current, found, status: stoppedAt.current === null ? 'resolved' : 'finished' }));

      if (stoppedAt.current !== null) {
        log.write(`Promise · finished anyway, ${milliseconds(performance.now() - stoppedAt.current)} after Stop`);
      }

      settle();
    });

    // a CancelablePromise: Stop cancels it, and the promise stops its own work
    task.current = searchWithCancelablePromise({
      steps: STEPS,
      pause,
      onStep: measure(setCancelable),
    });

    task.current.then(
      (found) => {
        setCancelable((current) => ({ ...current, found, status: 'resolved' }));
        log.write(`CancelablePromise · resolved · ${count(found)} primes`);
        settle();
      },
      (reason) => {
        setCancelable((current) => ({ ...current, status: 'canceled' }));
        log.write(`CancelablePromise · canceled · reason: "${String(reason)}"`);
        settle();
      },
    );
  };

  const stop = () => {
    if (stoppedAt.current !== null) return;

    stoppedAt.current = performance.now();

    setNative((current) => (current.status === 'running' ? { ...current, status: 'still running' } : current));
    task.current?.cancel('Stopped by user');
  };

  const stopped = stoppedAt.current !== null;

  const card = (name: string, title: string, side: Side, good: boolean) => {
    const tone = !stopped || side.status === 'idle' ? '' : good ? 'demo-stat--good' : 'demo-stat--bad';

    return (
      <section className="demo-card" aria-label={title}>
        <span>{title}</span>
        <div className="demo-progress" role="progressbar" aria-label={`${title} progress`} aria-valuemin={0} aria-valuemax={STEPS} aria-valuenow={side.step}>
          <span style={{ width: `${(side.step / STEPS) * 100}%` }} />
        </div>
        <dl className="demo-stats demo-stats--fixed">
          <div className={`demo-stat demo-stat--wide ${side.status === 'canceled' ? 'demo-stat--good' : side.status === 'still running' || side.status === 'finished' ? 'demo-stat--bad' : ''}`}>
            <dt>Status</dt>
            <dd data-testid={`${name}-status`}>{side.status}</dd>
          </div>
          <div className="demo-stat">
            <dt>Steps run</dt>
            <dd data-testid={`${name}-steps`}>
              {side.step} / {STEPS}
            </dd>
          </div>
          <div className="demo-stat">
            <dt>Primes found</dt>
            <dd data-testid={`${name}-found`}>{count(side.found)}</dd>
          </div>
          <div className={`demo-stat ${tone}`}>
            <dt>Steps after Stop</dt>
            <dd data-testid={`${name}-after-stop`}>{stopped ? side.afterStop : '—'}</dd>
          </div>
          <div className={`demo-stat ${tone}`}>
            <dt>Last step after Stop</dt>
            <dd data-testid={`${name}-wasted`}>{stopped ? milliseconds(side.wasted) : '—'}</dd>
          </div>
        </dl>
      </section>
    );
  };

  return (
    <div className="demo">
      <section className="demo-card" aria-label="Controls">
        <fieldset className="segmented">
          <legend>Same work in both promises: count primes, {STEPS} steps</legend>
          {DURATIONS.map((value) => (
            <label key={value}>
              <input type="radio" name="cancel-duration" checked={duration === value} disabled={running} onChange={() => setDuration(value)} />
              <span>{value} s</span>
            </label>
          ))}
        </fieldset>
        <div className="demo-actions">
          <button type="button" className="demo-button demo-button--primary" onClick={start} disabled={running}>
            {running ? 'Running…' : 'Start both'}
          </button>
          <button type="button" className="demo-button" onClick={stop} disabled={!running || stopped}>
            Stop both
          </button>
          <span className="demo-clock" data-testid="cancel-elapsed">
            {milliseconds(elapsed)}
          </span>
        </div>
        <p className="demo-caption">Press Stop while it runs. You stop waiting for both. Only one of them stops working.</p>
      </section>

      <div className="demo-results">
        <div className="demo-results-grid">
          {card('native', 'Promise · cannot be stopped', native, false)}
          {card('cancelable', 'CancelablePromise · stops the work', cancelable, true)}
        </div>
      </div>
    </div>
  );
}

/** Nothing outside the component to restore: the workbench remounts the demo. */
export const resetCancelDemo = () => {};

export const watchCancelDemo = log.watch;
