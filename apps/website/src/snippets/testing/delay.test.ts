import { delay } from './delay';

describe('delay', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('resolves with the value after the delay', async () => {
    const task = delay('done', 1000);

    expect(task.status).toBe('pending');

    await vi.advanceTimersByTimeAsync(1000);

    expect(await task).toBe('done');
    expect(task.status).toBe('resolved');
  });

  it('stops the timer when it is canceled', async () => {
    const task = delay('done', 1000);

    task.cancel('Not needed');

    // the status is known at once, no need to wait for the rejection
    expect(task.status).toBe('canceled');
    expect(vi.getTimerCount()).toBe(0);

    await expect(task).rejects.toBe('Not needed');
  });
});
