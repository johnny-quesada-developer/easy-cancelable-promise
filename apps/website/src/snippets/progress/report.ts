import { CancelablePromise } from 'easy-cancelable-promise';

export const processItems = (items: string[]) =>
  new CancelablePromise<string[]>((resolve, _reject, { onCancel, reportProgress }) => {
    const done: string[] = [];
    let timer: ReturnType<typeof setTimeout>;

    onCancel(() => clearTimeout(timer));

    const next = () => {
      const item = items[done.length];

      done.push(item.toUpperCase());

      // a percentage, and anything else the listeners may want to know
      reportProgress((done.length / items.length) * 100, { item });

      if (done.length === items.length) return resolve(done);

      timer = setTimeout(next);
    };

    timer = setTimeout(next);
  });
