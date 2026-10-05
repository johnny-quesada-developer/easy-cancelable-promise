interface EventListener {
  (evt: Event): void;
}

interface EventListenerObject {
  handleEvent(object: Event): void;
}

interface EventListenerOptions {
  capture?: boolean;
}

interface AddEventListenerOptions extends EventListenerOptions {
  /** When `true`, the listener is automatically removed when it is first invoked. Default: `false`. */
  once?: boolean;
  /** When `true`, serves as a hint that the listener will not call the `Event` object's `preventDefault()` method. Default: false. */
  passive?: boolean;
}

/** Function to remove an event listener. */
export type RemoveEventListener = () => void;

/** Extended AbortSignal with subscription management. */
export interface CancelableAbortSignal extends AbortSignal {
  // Internal marker for type checking
  __is_cancelable_abort_signal: true;

  /**
   * Subscribe to signal events with automatic cleanup support.
   * @param listener - The event listener callback
   * @param options - Event listener options
   * @returns Function to remove this specific listener
   */
  subscribe(
    listener: EventListener | EventListenerObject,
    options?: AddEventListenerOptions | boolean,
  ): RemoveEventListener;

  /**
   * Subscribe to a specific event type on the signal.
   * @param type - The event type to listen for
   * @param listener - The event listener callback
   * @param options - Event listener options
   * @returns Function to remove this specific listener
   */
  subscribe(
    type: string,
    listener: EventListener | EventListenerObject,
    options?: AddEventListenerOptions | boolean,
  ): RemoveEventListener;
}

/**
 * Enhanced AbortController with subscription management.
 *
 * @example
 * ```ts
 * const controller = new CancelableAbortController();
 * const unsub = controller.signal.subscribe(() => console.log('Aborted'));
 * controller.abort(); // Cleanup all listeners
 * ```
 */
export class CancelableAbortController extends AbortController {
  private _subscriptions: Set<RemoveEventListener> = new Set();

  /**
   * Get all active subscription cleanup functions.
   */
  public get subscriptions() {
    return Array.from(this._subscriptions ?? []);
  }

  public signal: CancelableAbortSignal;

  constructor() {
    super();

    // Mark signal as CancelableAbortSignal for type checking
    this.signal.__is_cancelable_abort_signal = true;
    this.signal.subscribe = (...args: unknown[]) => {
      if (!this._subscriptions) {
        throw new Error('AbortController was already aborted or disposed.');
      }

      // Parse overloaded arguments
      const [arg1, arg2, arg3] = args;

      const type = typeof arg1 === 'string' ? arg1 : 'abort';

      const listener = (typeof arg1 === 'string' ? arg2 : arg1) as
        | EventListener
        | EventListenerObject;

      const options = (typeof arg1 === 'string' ? arg3 : arg2) as
        | AddEventListenerOptions
        | boolean;

      this.signal.addEventListener(type, listener, options);

      const removeEventListener = () => {
        this.signal.removeEventListener(type, listener, options);
      };

      this._subscriptions.add(removeEventListener);

      return removeEventListener;
    };
  }

  /**
   * Abort the signal and cleanup all subscriptions.
   */
  abort() {
    super.abort();

    this.dispose();
  }

  /**
   * Remove all event listeners and cleanup subscriptions.
   */
  dispose() {
    this._subscriptions?.forEach((subscription) => subscription());
    this._subscriptions = null;
  }
}

export default CancelableAbortController;
