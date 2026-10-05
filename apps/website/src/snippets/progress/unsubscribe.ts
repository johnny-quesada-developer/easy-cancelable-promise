import { CancelableAbortController } from 'easy-cancelable-promise';
import { processItems } from './report';

export async function unsubscribe() {
  const updates: number[] = [];
  const controller = new CancelableAbortController();

  const task = processItems(['a', 'b', 'c', 'd']).onProgress(
    (percentage) => {
      updates.push(percentage);

      // stop listening after the first half
      if (percentage >= 50) controller.abort();
    },
    { signal: controller.signal },
  );

  await task;

  return updates; // [25, 50]
}
