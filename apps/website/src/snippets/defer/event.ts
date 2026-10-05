import { defer } from 'easy-cancelable-promise';

export function waitForClick(button: HTMLButtonElement, timeout = 30_000) {
  const deferred = defer<MouseEvent>();

  const onClick = (event: MouseEvent) => deferred.resolve(event);
  const timer = setTimeout(() => deferred.cancel('Timeout'), timeout);

  button.addEventListener('click', onClick);

  // however it ends, remove what was added
  deferred.promise
    .finally(() => {
      clearTimeout(timer);
      button.removeEventListener('click', onClick);
    })
    .catch(() => {});

  return deferred.promise;
}
