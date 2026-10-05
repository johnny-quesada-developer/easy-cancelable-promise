// What you keep track of by hand to stop one task.
type Status = 'pending' | 'resolved' | 'rejected' | 'canceled';

export function countdown(seconds: number) {
  let status: Status = 'pending';
  let timer: ReturnType<typeof setTimeout>;
  let rejectPromise: (reason: unknown) => void;
  const cleanups: (() => void)[] = [];

  const promise = new Promise<string>((resolve, reject) => {
    rejectPromise = reject;

    timer = setTimeout(() => {
      status = 'resolved';
      resolve('Done!');
    }, seconds * 1000);
  });

  return {
    promise,
    getStatus: () => status,
    onCancel: (cleanup: () => void) => cleanups.push(cleanup),
    cancel(reason: unknown) {
      if (status !== 'pending') return;

      status = 'canceled';
      clearTimeout(timer);
      cleanups.forEach((cleanup) => cleanup());
      rejectPromise(reason);
    },
  };
}
