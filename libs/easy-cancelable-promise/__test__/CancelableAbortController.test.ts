import {
  CancelableAbortController,
  isCancelableAbortSignal,
} from 'easy-cancelable-promise';

describe('CancelableAbortController', () => {
  it('should mark the signal as a CancelableAbortSignal', () => {
    const controller = new CancelableAbortController();

    expect(isCancelableAbortSignal(controller.signal)).toBe(true);
    expect(isCancelableAbortSignal(new AbortController().signal)).toBe(false);
    expect(isCancelableAbortSignal(undefined)).toBe(false);
  });

  it('should call the listeners of the abort event', () => {
    const controller = new CancelableAbortController();
    const listener = vi.fn();

    controller.signal.subscribe(listener);

    expect(controller.subscriptions).toHaveLength(1);

    controller.abort();

    expect(listener).toHaveBeenCalledTimes(1);
    expect(controller.signal.aborted).toBe(true);
  });

  it('should subscribe to a specific event type', () => {
    const controller = new CancelableAbortController();
    const listener = vi.fn();

    controller.signal.subscribe('custom', listener, { once: true });

    controller.signal.dispatchEvent(new Event('custom'));
    controller.signal.dispatchEvent(new Event('custom'));

    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('should accept an object as listener', () => {
    const controller = new CancelableAbortController();
    const listener = { handleEvent: vi.fn() };

    controller.signal.subscribe(listener);
    controller.abort();

    expect(listener.handleEvent).toHaveBeenCalledTimes(1);
  });

  it('should remove a single listener', () => {
    const controller = new CancelableAbortController();
    const removed = vi.fn();
    const kept = vi.fn();

    const unsubscribe = controller.signal.subscribe(removed);
    controller.signal.subscribe(kept);

    unsubscribe();
    controller.abort();

    expect(removed).not.toHaveBeenCalled();
    expect(kept).toHaveBeenCalledTimes(1);
  });

  it('should remove all the listeners on dispose without aborting the signal', () => {
    const controller = new CancelableAbortController();
    const listener = vi.fn();

    controller.signal.subscribe(listener);
    controller.dispose();

    expect(controller.subscriptions).toEqual([]);
    expect(controller.signal.aborted).toBe(false);

    // the native abort still works, but the listeners are gone
    AbortController.prototype.abort.call(controller);

    expect(controller.signal.aborted).toBe(true);
    expect(listener).not.toHaveBeenCalled();
  });

  it('should not allow new subscriptions after abort or dispose', () => {
    const aborted = new CancelableAbortController();
    aborted.abort();

    const disposed = new CancelableAbortController();
    disposed.dispose();

    expect(() => aborted.signal.subscribe(() => {})).toThrow(
      'AbortController was already aborted or disposed.',
    );
    expect(() => disposed.signal.subscribe(() => {})).toThrow(
      'AbortController was already aborted or disposed.',
    );

    // dispose can be called more than once
    expect(() => disposed.dispose()).not.toThrow();
  });
});
