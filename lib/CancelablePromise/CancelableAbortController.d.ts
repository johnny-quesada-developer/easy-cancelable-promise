/// <reference types="node" />
/// <reference types="node" />
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
export type TRemoveEventListener = () => void;
export interface CancelableAbortSignal extends AbortSignal {
    subscribe(listener: EventListener | EventListenerObject, options?: AddEventListenerOptions | boolean): TRemoveEventListener;
    subscribe(type: string, listener: EventListener | EventListenerObject, options?: AddEventListenerOptions | boolean): TRemoveEventListener;
}
export declare class CancelableAbortController extends AbortController {
    private _subscriptions;
    get subscriptions(): TRemoveEventListener[];
    signal: CancelableAbortSignal;
    constructor();
    /**
     * Abort and reset the controller.
     */
    abort(): void;
    /**
     * Remove all listeners.
     */
    dispose(): void;
}
export {};
