/**
 * The same queue written by hand with native promises: batches of `size`, one batch after the other.
 * Nothing here can be stopped. After the caller walks away the running tasks finish, and the tasks
 * that are still in the queue start anyway.
 */
export async function runInBatches<T>(tasks: (() => Promise<T>)[], size: number): Promise<T[]> {
  const results: T[] = [];

  for (let index = 0; index < tasks.length; index += size) {
    const batch = tasks.slice(index, index + size).map((task) => task());

    results.push(...(await Promise.all(batch)));
  }

  return results;
}
