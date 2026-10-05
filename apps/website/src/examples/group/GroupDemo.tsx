import { useEffect, useRef, useState } from 'react';
import { groupAsCancelablePromise, type CancelablePromise } from 'easy-cancelable-promise';
import '../shared/demo.css';
import { createLog } from '../shared/log';
import { count, milliseconds } from '../shared/format';
import { DEFAULT_DURATION, DURATIONS, type Duration } from '../shared/durations';
import { searchWithCancelablePromise, searchWithNativePromise } from '../shared/search';
import { useElapsed } from '../shared/useElapsed';
import { runInBatches } from './batches';

type TaskStatus = 'queued' | 'running' | 'done' | 'canceled' | 'never started';

interface Task {
  status: TaskStatus;
  step: number;
  /** The task started after Stop was pressed. */
  startedAfterStop: boolean;
}

interface Side {
  status: 'idle' | 'running' | 'still running' | 'finished' | 'resolved' | 'canceled';
  tasks: Task[];
  /** Steps that ran after Stop was pressed. */
  afterStop: number;
  total: number | null;
}

const log = createLog();

export const TASKS = 6;
export const STEPS_PER_TASK = 10;
export const MAX_CONCURRENT = 2;

const idleTasks = (): Task[] => Array.from({ length: TASKS }, () => ({ status: 'queued', step: 0, startedAfterStop: false }));

const idle = (): Side => ({ status: 'idle', tasks: idleTasks(), afterStop: 0, total: null });

const sum = (values: number[]) => values.reduce((total, value) => total + value, 0);

export function GroupDemo() {
  const [duration, setDuration] = useState<Duration>(DEFAULT_DURATION);
  const [native, setNative] = useState<Side>(idle);
  const [cancelable, setCancelable] = useState<Side>(idle);
  const [running, setRunning] = useState(false);
  const { elapsed, start: startClock, stop: stopClock } = useElapsed();

  const group = useRef<CancelablePromise<number[]> | null>(null);
  const stoppedAt = useRef<number | null>(null);
  const pending = useRef(0);

  useEffect(
    () => () => {
      group.current?.cancel('The example was closed');
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
    // the tasks run in batches of MAX_CONCURRENT, one batch after the other
    const pause = (duration * 1000) / ((TASKS / MAX_CONCURRENT) * STEPS_PER_TASK);

    stoppedAt.current = null;
    pending.current = 2;

    setRunning(true);
    setNative({ ...idle(), status: 'running' });
    setCancelable({ ...idle(), status: 'running' });
    startClock();
    log.write(`started · ${TASKS} tasks, ${MAX_CONCURRENT} at a time`);

    const update = (set: typeof setNative, index: number, changes: (task: Task) => Partial<Task>, stepRan = false) =>
      set((current) => ({
        ...current,
        afterStop: current.afterStop + (stepRan && stoppedAt.current !== null ? 1 : 0),
        tasks: current.tasks.map((task, position) => (position === index ? { ...task, ...changes(task) } : task)),
      }));

    const options = (set: typeof setNative, index: number) => ({
      from: index * STEPS_PER_TASK,
      steps: STEPS_PER_TASK,
      pause,
      onStep: ({ step }: { step: number }) => update(set, index, () => ({ step, status: step === STEPS_PER_TASK ? 'done' : 'running' }), true),
    });

    // native promises in a queue written by hand: Stop cannot reach the running tasks, nor the queue
    runInBatches(
      Array.from({ length: TASKS }, (_, index) => () => {
        update(setNative, index, () => ({ status: 'running', startedAfterStop: stoppedAt.current !== null }));

        return searchWithNativePromise(options(setNative, index));
      }),
      MAX_CONCURRENT,
    ).then((results) => {
      setNative((current) => ({ ...current, total: sum(results), status: stoppedAt.current === null ? 'resolved' : 'finished' }));

      if (stoppedAt.current !== null) {
        log.write(`Promise queue · finished anyway, ${milliseconds(performance.now() - stoppedAt.current)} after Stop`);
      }

      settle();
    });

    // one cancelable group: canceling it cancels the running tasks and never starts the queued ones
    group.current = groupAsCancelablePromise<number[]>(
      Array.from({ length: TASKS }, (_, index) => () => {
        update(setCancelable, index, () => ({ status: 'running' }));

        return searchWithCancelablePromise(options(setCancelable, index)).onCancel(() =>
          update(setCancelable, index, () => ({ status: 'canceled' })),
        );
      }),
      { maxConcurrent: MAX_CONCURRENT },
    );

    group.current!.then(
      (results) => {
        setCancelable((current) => ({ ...current, total: sum(results), status: 'resolved' }));
        log.write(`group · resolved · ${count(sum(results))} primes`);
        settle();
      },
      (reason) => {
        setCancelable((current) => ({
          ...current,
          status: 'canceled',
          tasks: current.tasks.map((task) => (task.status === 'queued' ? { ...task, status: 'never started' } : task)),
        }));
        log.write(`group · canceled · reason: "${String(reason)}"`);
        settle();
      },
    );
  };

  const stop = () => {
    if (stoppedAt.current !== null) return;

    stoppedAt.current = performance.now();

    setNative((current) => (current.status === 'running' ? { ...current, status: 'still running' } : current));
    group.current?.cancel('Stopped by user');
  };

  const stopped = stoppedAt.current !== null;
  const amount = (side: Side, status: TaskStatus) => side.tasks.filter((task) => task.status === status).length;

  const card = (name: string, title: string, side: Side, good: boolean) => {
    const tone = !stopped || side.status === 'idle' ? '' : good ? 'demo-stat--good' : 'demo-stat--bad';
    const startedAfterStop = side.tasks.filter((task) => task.startedAfterStop).length;

    return (
      <section className="demo-card" aria-label={title}>
        <span>{title}</span>
        <ul className="demo-lanes">
          {side.tasks.map((task, index) => (
            <li className={`demo-lane ${task.status === 'done' ? 'demo-lane--done' : ''} ${task.status === 'canceled' || task.status === 'never started' ? 'demo-lane--stopped' : ''}`} key={index}>
              <span>task {index + 1}</span>
              <div className="demo-progress" aria-hidden="true">
                <span style={{ width: `${(task.step / STEPS_PER_TASK) * 100}%` }} />
              </div>
              <span data-testid={`${name}-task-${index + 1}`}>{task.status}</span>
            </li>
          ))}
        </ul>
        <dl className="demo-stats demo-stats--fixed">
          <div className={`demo-stat ${side.status === 'canceled' ? 'demo-stat--good' : side.status === 'still running' || side.status === 'finished' ? 'demo-stat--bad' : ''}`}>
            <dt>Status</dt>
            <dd data-testid={`${name}-status`}>{side.status}</dd>
          </div>
          <div className="demo-stat">
            <dt>Tasks done</dt>
            <dd data-testid={`${name}-done`}>
              {amount(side, 'done')} / {TASKS}
            </dd>
          </div>
          <div className={`demo-stat ${tone}`}>
            <dt>Started after Stop</dt>
            <dd data-testid={`${name}-started-after-stop`}>{stopped ? startedAfterStop : '—'}</dd>
          </div>
          <div className={`demo-stat ${tone}`}>
            <dt>Steps after Stop</dt>
            <dd data-testid={`${name}-after-stop`}>{stopped ? side.afterStop : '—'}</dd>
          </div>
          <div className="demo-stat demo-stat--wide">
            <dt>Primes found by the group</dt>
            <dd data-testid={`${name}-total`}>{side.total === null ? '—' : count(side.total)}</dd>
          </div>
        </dl>
      </section>
    );
  };

  return (
    <div className="demo">
      <section className="demo-card" aria-label="Controls">
        <fieldset className="segmented">
          <legend>
            {TASKS} tasks, {MAX_CONCURRENT} at a time
          </legend>
          {DURATIONS.map((value) => (
            <label key={value}>
              <input type="radio" name="group-duration" checked={duration === value} disabled={running} onChange={() => setDuration(value)} />
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
          <span className="demo-clock" data-testid="group-elapsed">
            {milliseconds(elapsed)}
          </span>
        </div>
        <p className="demo-caption">Press Stop while the first tasks run. One call cancels the whole group, including the tasks that did not start yet.</p>
      </section>

      <div className="demo-results">
        <div className="demo-results-grid">
          {card('native', 'Promise queue · runs to the end', native, false)}
          {card('cancelable', 'groupAsCancelablePromise · one cancel', cancelable, true)}
        </div>
      </div>
    </div>
  );
}

/** Nothing outside the component to restore: the workbench remounts the demo. */
export const resetGroupDemo = () => {};

export const watchGroupDemo = log.watch;
