import { CancelablePromise } from 'easy-cancelable-promise';

export const openSocket = (url: string) =>
  new CancelablePromise<string>((resolve, reject, { onCancel }) => {
    const socket = new WebSocket(url);

    // the promise owns its cleanup: whoever cancels it does not need to know about the socket
    onCancel(() => socket.close());

    socket.addEventListener('message', (event) => resolve(String(event.data)), { once: true });
    socket.addEventListener('error', () => reject(new Error('Connection failed')), { once: true });
  });
