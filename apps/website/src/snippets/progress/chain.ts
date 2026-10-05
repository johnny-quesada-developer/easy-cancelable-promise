import { processItems } from './report';

export async function chain() {
  const updates: number[] = [];

  // the progress of a promise reaches every promise chained from it
  const summary = processItems(['a', 'b']).then((items) => items.join(', '));

  summary.onProgress((percentage) => updates.push(percentage));

  return { text: await summary, updates }; // { text: 'A, B', updates: [50, 100] }
}
