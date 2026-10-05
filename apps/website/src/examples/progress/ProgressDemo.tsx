import { useEffect, useRef, useState } from 'react';
import type { CancelablePromise } from 'easy-cancelable-promise';
import '../shared/demo.css';
import { createLog } from '../shared/log';
import { count, milliseconds } from '../shared/format';
import { DEFAULT_DURATION, DURATIONS, type Duration } from '../shared/durations';
import { searchWithCancelablePromise, searchWithNativePromise } from '../shared/search';
import { useElapsed } from '../shared/useElapsed';

type Status = 'idle' | 'waiting' | 'running' | 'resolved';

interface Side {
  status: Status;
  /** Progress updates received from the promise. */
  updates: number;
  /** Updates received by a promise chained with `.then()`. */
  chained: number;
  /** Milliseconds until the promise said anything at all. */
  firstFeedback: number | null;
  percentage: number;
  found: number | null;
}

const log = createLog();

export const STEPS = 40;

const idle: Side = { status: 'idle', updates: 0, chained: 0, firstFeedback: null, percentage: 0, found: null };

export function ProgressDemo() {
  const [duration, setDuration] = useState<Duration>(DEFAULT_DURATION);
  const [native, setNative] = useState<Side>(idle);
  const [cancelable, setCancelable] = useState<Side>(idle);
  const [running, setRunning] = useState(false);
  const { elapsed, start: startClock, stop: stopClock } = useElapsed();

  const task = useRef<CancelablePromise<number> | null>(null);
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
    const startedAt = performance.now();

    pending.current = 2;

    setRunning(true);
    setNative({ ...idle, status: 'waiting' });
    setCancelable({ ...idle, status: 'running' });
    startClock();
    log.write(`started · ${STEPS} steps in ${duration} s`);

    // a native promise has one moment to say something: the end
    searchWithNativePromise({ steps: STEPS, pause }).then((found) => {
      setNative((current) => ({ ...current, status: 'resolved', found, percentage: 100, firstFeedback: performance.now() - startedAt }));
      settle();
    });

    // a CancelablePromise reports while it works
    task.current = searchWithCancelablePromise({ steps: STEPS, pause }).onProgress((percentage, details) => {
      const { found } = details as { found: number };

      setCancelable((current) => ({
        ...current,
        percentage,
        found,
        updates: current.updates + 1,
        firstFeedback: current.firstFeedback ?? performance.now() - startedAt,
      }));
    });

    // the progress also reaches the promises chained from it
    const summary = task.current.then((found) => `${count(found)} primes`);

    summary.onProgress(() => setCancelable((current) => ({ ...current, chained: current.chained + 1 })));

    summary.then(
      (text) => {
        setCancelable((current) => ({ ...current, status: 'resolved', percentage: 100 }));
        log.write(`CancelablePromise · resolved · ${text} · ${STEPS} progress updates`);
        settle();
      },
      () => settle(),
    );
  };

  return (
    <div className="demo">
      <section className="demo-card" aria-label="Controls">
        <fieldset className="segmented">
          <legend>Same work in both promises: count primes, {STEPS} steps</legend>
          {DURATIONS.map((value) => (
            <label key={value}>
              <input type="radio" name="progress-duration" checked={duration === value} disabled={running} onChange={() => setDuration(value)} />
              <span>{value} s</span>
            </label>
          ))}
        </fieldset>
        <div className="demo-actions">
          <button type="button" className="demo-button demo-button--primary" onClick={start} disabled={running}>
            {running ? 'Running…' : 'Start both'}
          </button>
          <span className="demo-clock" data-testid="progress-elapsed">
            {milliseconds(elapsed)}
          </span>
        </div>
      </section>

      <div className="demo-results">
        <div className="demo-results-grid">
          <section className="demo-card" aria-label="Promise · silent until the end">
            <span>Promise · silent until the end</span>
            <div className={`demo-progress ${native.status === 'waiting' ? 'demo-progress--unknown' : ''}`} role="progressbar" aria-label="Promise progress" aria-valuetext={native.status === 'waiting' ? 'unknown' : `${native.percentage}%`}>
              <span style={{ width: `${native.percentage}%` }} />
            </div>
            <dl className="demo-stats demo-stats--fixed">
              <div className={`demo-stat ${native.status === 'idle' ? '' : 'demo-stat--bad'}`}>
                <dt>Progress updates</dt>
                <dd data-testid="native-updates">{native.status === 'idle' ? '—' : native.updates}</dd>
              </div>
              <div className={`demo-stat ${native.firstFeedback === null ? '' : 'demo-stat--bad'}`}>
                <dt>First feedback after</dt>
                <dd data-testid="native-first-feedback">{native.firstFeedback === null ? (native.status === 'waiting' ? 'nothing yet' : '—') : milliseconds(native.firstFeedback)}</dd>
              </div>
              <div className="demo-stat">
                <dt>Progress known</dt>
                <dd data-testid="native-progress">{native.status === 'waiting' ? 'unknown' : `${Math.round(native.percentage)}%`}</dd>
              </div>
              <div className="demo-stat">
                <dt>Primes found</dt>
                <dd data-testid="native-found">{native.found === null ? (native.status === 'waiting' ? 'unknown' : '—') : count(native.found)}</dd>
              </div>
              <div className={`demo-stat demo-stat--wide ${native.status === 'idle' ? '' : 'demo-stat--bad'}`}>
                <dt>Updates received through .then()</dt>
                <dd data-testid="native-chained">{native.status === 'idle' ? '—' : 0}</dd>
              </div>
            </dl>
          </section>

          <section className="demo-card" aria-label="CancelablePromise · reports while it works">
            <span>CancelablePromise · reports while it works</span>
            <div className="demo-progress" role="progressbar" aria-label="CancelablePromise progress" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(cancelable.percentage)}>
              <span style={{ width: `${cancelable.percentage}%` }} />
            </div>
            <dl className="demo-stats demo-stats--fixed">
              <div className={`demo-stat ${cancelable.updates ? 'demo-stat--good' : ''}`}>
                <dt>Progress updates</dt>
                <dd data-testid="cancelable-updates">{cancelable.status === 'idle' ? '—' : cancelable.updates}</dd>
              </div>
              <div className={`demo-stat ${cancelable.firstFeedback === null ? '' : 'demo-stat--good'}`}>
                <dt>First feedback after</dt>
                <dd data-testid="cancelable-first-feedback">{cancelable.firstFeedback === null ? '—' : milliseconds(cancelable.firstFeedback)}</dd>
              </div>
              <div className="demo-stat">
                <dt>Progress known</dt>
                <dd data-testid="cancelable-progress">{Math.round(cancelable.percentage)}%</dd>
              </div>
              <div className="demo-stat">
                <dt>Primes found</dt>
                <dd data-testid="cancelable-found">{cancelable.found === null ? '—' : count(cancelable.found)}</dd>
              </div>
              <div className={`demo-stat demo-stat--wide ${cancelable.chained ? 'demo-stat--good' : ''}`}>
                <dt>Updates received through .then()</dt>
                <dd data-testid="cancelable-chained">{cancelable.status === 'idle' ? '—' : cancelable.chained}</dd>
              </div>
            </dl>
          </section>
        </div>
      </div>

      <p className="demo-caption">
        Both promises resolve with the same number. One of them told the page how far it was, {STEPS} times, through the promise itself.
      </p>
    </div>
  );
}

/** Nothing outside the component to restore: the workbench remounts the demo. */
export const resetProgressDemo = () => {};

export const watchProgressDemo = log.watch;
