import { example as useIt } from './getting-started/use-it';
import { example as progressExample, upload } from './getting-started/progress';
import { statuses } from './cancelable-promise/status';
import { chain as chaining } from './cancelable-promise/chaining';
import { settleOnce } from './cancelable-promise/settle-once';
import { executorThrows } from './cancelable-promise/executor-throws';
import { listen as listenToCancel } from './cancel/on-cancel-outside';
import { reasons } from './cancel/reason';
import { load } from './cancel/handle';
import { unsubscribe as unsubscribeCancel } from './cancel/unsubscribe';
import { listenerThrows } from './cancel/listener-throws';
import { listen as listenToProgress } from './progress/listen';
import { chain as progressChain } from './progress/chain';
import { unsubscribe as unsubscribeProgress } from './progress/unsubscribe';
import { reportFromOutside } from './progress/report-outside';
import { basic as deferBasic } from './defer/basic';
import { utils as deferUtils } from './defer/utils';
import { waitForClick } from './defer/event';
import { all, cancelAll, oneIsCanceled } from './statics/all';
import { allSettled } from './statics/all-settled';
import { race } from './statics/race';
import { shortcuts } from './statics/shortcuts';
import { convert } from './convert/to-cancelable';
import { limits } from './convert/limits';
import { examples as guardExamples, normalize } from './convert/guards';
import { basic as groupBasic } from './group/basic';
import { cancelGroup } from './group/cancel';
import { config as groupConfig } from './group/config';
import { sequential } from './group/sequential';
import { errors as groupErrors } from './group/errors';
import { controller } from './signals/controller';
import { mounted } from './signals/with-promise';
import { dispose } from './signals/dispose';
import { load as loadWithReasons, TimeoutError } from './typescript/reasons';
import { sameClass } from './typescript/subpaths';
import { countdown as countdownByHand } from './home/by-hand';
import { CancelablePromise, defer, isCancelablePromise } from 'easy-cancelable-promise';

/**
 * The code samples of the documentation, executed against the built package.
 * Each expectation is the result the page shows in the comments of the sample.
 */
describe('documentation snippets', () => {
  beforeEach(() => vi.spyOn(console, 'log').mockImplementation(() => {}));
  afterEach(() => vi.restoreAllMocks());

  describe('getting started', () => {
    it('awaits, cancels and reads the status', async () => {
      expect(await useIt()).toBe('Done!');
      expect(vi.mocked(console.log).mock.calls.map(([value]) => value)).toEqual(['Done!', 'pending', 'canceled', 'No longer needed']);
    });

    it('reports progress', async () => {
      expect(await progressExample()).toBe(4);
      expect(vi.mocked(console.log).mock.calls.map(([value]) => value)).toEqual(['25%', '50%', '75%', '100%']);
      expect(isCancelablePromise(upload(['a']))).toBe(true);
    });
  });

  describe('CancelablePromise', () => {
    it('has a status for each way it can end', async () => {
      expect(await statuses()).toEqual(['resolved', 'rejected', 'canceled']);
    });

    it('cancels the whole chain from its last promise', async () => {
      const result = chaining();

      expect(result).toMatchObject({ source: 'canceled', doubled: 'canceled', text: 'canceled', stopped: true });
      expect(await result.last).toBe('Not needed');
    });

    it('settles once', async () => {
      expect(await settleOnce()).toEqual(['first', 'pending', 'resolved']);
    });

    it('rejects when the callback throws', async () => {
      expect(await executorThrows()).toEqual(['rejected', 'Could not start']);
    });
  });

  describe('cancel and onCancel', () => {
    it('calls the listeners in order', () => {
      expect(listenToCancel()).toEqual(['inside', 'outside: User closed the dialog', 'analytics']);
    });

    it('rejects with the reason', async () => {
      expect(await reasons()).toEqual(['Promise canceled', { code: 'TIMEOUT' }]);
    });

    it('tells a cancellation from a failure', async () => {
      const canceled = defer<string>();
      const failed = defer<string>();

      canceled.cancel();
      failed.reject(new Error('failed'));

      expect(await load(canceled.promise)).toBeNull();
      await expect(load(failed.promise)).rejects.toThrow('failed');
      expect(await load(CancelablePromise.resolve('value'))).toBe('value');
    });

    it('removes listeners', () => {
      expect(unsubscribeCancel()).toEqual(['delete the temporary file']);
    });

    it('cancels even if a listener throws', () => {
      expect(listenerThrows()).toEqual(['canceled', 'still called', 'This listener failed']);
    });
  });

  describe('progress', () => {
    it('delivers every update to every listener', async () => {
      expect(await listenToProgress()).toEqual({
        result: ['A', 'B', 'C', 'D'],
        updates: ['25%', 'a', '50%', 'b', '75%', 'c', '100%', 'd'],
      });
    });

    it('reaches the chained promises', async () => {
      expect(await progressChain()).toEqual({ text: 'A, B', updates: [50, 100] });
    });

    it('stops listening with a signal', async () => {
      expect(await unsubscribeProgress()).toEqual([25, 50]);
    });

    it('can be reported from outside', () => {
      expect(reportFromOutside()).toEqual([30, 60]);
    });
  });

  describe('defer', () => {
    it('resolves from outside', async () => {
      expect(await deferBasic()).toBe('Hello world!');
    });

    it('exposes the utilities', () => {
      expect(deferUtils()).toEqual([['pending', true, false], 'canceled', 'canceled']);
    });

    it('resolves with the click and removes the listener', async () => {
      const button = document.createElement('button');
      const removed = vi.spyOn(button, 'removeEventListener');
      const click = waitForClick(button);

      button.click();

      expect(await click).toBeInstanceOf(MouseEvent);
      await Promise.resolve();
      expect(removed).toHaveBeenCalledWith('click', expect.any(Function));
    });

    it('cancels the click after the timeout', async () => {
      vi.useFakeTimers();

      const click = waitForClick(document.createElement('button'), 1000);

      vi.advanceTimersByTime(1000);
      vi.useRealTimers();

      await expect(click).rejects.toBe('Timeout');
      expect(click.status).toBe('canceled');
    });
  });

  describe('static helpers', () => {
    it('all', async () => {
      expect(await all()).toEqual(['user', 42, true]);
      expect(cancelAll()).toEqual(['canceled', 'canceled', 'canceled']);
      expect(await oneIsCanceled()).toEqual(['canceled', 'canceled', 'canceled']);
    });

    it('allSettled', async () => {
      expect(await allSettled()).toEqual(['fulfilled', 'rejected', 'canceled']);
    });

    it('race', async () => {
      expect(await race()).toEqual(['fast', 'canceled']);
    });

    it('resolve, reject and canceled', async () => {
      expect(await shortcuts()).toEqual(['resolved', 'rejected', 'canceled']);
    });
  });

  describe('converting', () => {
    it('converts promises, values and functions', async () => {
      expect(await convert()).toEqual({ values: [1, 2, 3, 4], sameInstance: true });
    });

    it('cannot stop the work of a native promise', async () => {
      expect(await limits()).toEqual(['canceled', true]);
    });

    it('guards', async () => {
      expect(guardExamples).toEqual(['cancelable, pending', 'promise', 'promise', 'value']);
      expect(await normalize(5)).toBe(5);
    });
  });

  describe('groups', () => {
    it('keeps the results in the order of the tasks', async () => {
      expect(await groupBasic()).toEqual(['user 1', 'user 2', 'user 3', 'user 4', 'user 5']);
      expect(vi.mocked(console.log).mock.calls.map(([value]) => value)).toEqual(['20% complete', '40% complete', '60% complete', '80% complete', '100% complete']);
    });

    it('cancels the running tasks and never starts the rest', async () => {
      expect(await cancelGroup()).toEqual({ started: [1, 2], stopped: [1, 2], reason: 'User navigated away', status: 'canceled' });
    });

    it('calls the callbacks of the configuration', async () => {
      expect(await groupConfig()).toEqual({
        results: ['a', 'b', 'c'],
        events: ['starting', 'starting', 'finished a', 'finished b', 'starting', 'finished c', 'done: a,b,c'],
      });
    });

    it('runs in order', async () => {
      expect(await sequential()).toEqual({
        results: ['one', 'two', 'three'],
        order: ['start one', 'end one', 'start two', 'end two', 'start three', 'end three'],
      });
    });

    it('rejects with the first failure', async () => {
      expect(await groupErrors()).toEqual({ reason: 'b failed', started: ['a', 'b'], status: 'rejected' });
    });
  });

  describe('signals', () => {
    it('CancelableAbortController', () => {
      expect(controller()).toEqual({ calls: ['second'], active: 2, aborted: true, isCancelable: true, isNativeCancelable: false });
    });

    it('removes the listeners of a promise', () => {
      expect(mounted()).toEqual([[], 'canceled']);
    });

    it('dispose', () => {
      expect(dispose()).toEqual([[], false, 'AbortController was already aborted or disposed.']);
    });
  });

  describe('typescript', () => {
    it('narrows the reasons', async () => {
      const timeout = defer<string>();
      const failed = defer<string>();
      const canceled = defer<string>();

      timeout.reject(new TimeoutError());
      failed.reject(new Error('Not found'));
      canceled.cancel('Not needed');

      expect(await loadWithReasons(timeout.promise)).toBe('Took too long');
      expect(await loadWithReasons(failed.promise)).toBe('Not found');
      expect(await loadWithReasons(canceled.promise)).toBe('Not needed');
    });

    it('shares one class between the entries of the package', () => {
      expect(sameClass).toBe(true);
    });
  });

  describe('home', () => {
    it('the version written by hand behaves like the library', async () => {
      const cleanup = vi.fn();
      const task = countdownByHand(5);

      task.onCancel(cleanup);
      task.cancel('No longer needed');

      await expect(task.promise).rejects.toBe('No longer needed');
      expect(task.getStatus()).toBe('canceled');
      expect(cleanup).toHaveBeenCalledTimes(1);
    });
  });
});
