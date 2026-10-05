import { CancelablePromise } from 'easy-cancelable-promise';

export const upload = (chunks: string[]) =>
  new CancelablePromise<number>((resolve, _reject, { onCancel, reportProgress }) => {
    let sent = 0;
    let timer: ReturnType<typeof setTimeout>;

    onCancel(() => clearTimeout(timer));

    const next = () => {
      sent += 1;

      reportProgress((sent / chunks.length) * 100, { sent });

      if (sent === chunks.length) return resolve(sent);

      timer = setTimeout(next, 10);
    };

    timer = setTimeout(next, 10);
  });

export const example = () =>
  upload(['a', 'b', 'c', 'd']).onProgress((percentage) => {
    console.log(`${percentage}%`); // 25%, 50%, 75%, 100%
  });
