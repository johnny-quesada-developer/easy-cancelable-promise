import { processItems } from './report';

export async function listen() {
  const updates: string[] = [];

  const result = await processItems(['a', 'b', 'c', 'd'])
    // onProgress returns the promise, so listeners can be chained and awaited
    .onProgress((percentage) => updates.push(`${percentage}%`))
    .onProgress((_percentage, metadata) => updates.push((metadata as { item: string }).item));

  return { result, updates };
  // result: ['A', 'B', 'C', 'D']
  // updates: ['25%', 'a', '50%', 'b', '75%', 'c', '100%', 'd']
}
