/** How many numbers one step checks. Small enough that a step never blocks the page. */
export const STEP_SIZE = 20_000;

export function isPrime(candidate: number): boolean {
  if (candidate < 2) return false;
  if (candidate % 2 === 0) return candidate === 2;

  for (let divisor = 3; divisor * divisor <= candidate; divisor += 2) {
    if (candidate % divisor === 0) return false;
  }

  return true;
}

/** The real work of every example: counts the primes in the range of numbers that belongs to a step. */
export function primesInStep(step: number): number {
  const from = step * STEP_SIZE;
  let found = 0;

  for (let candidate = from; candidate < from + STEP_SIZE; candidate++) {
    if (isPrime(candidate)) found += 1;
  }

  return found;
}

export interface Step {
  /** Steps completed so far. */
  step: number;
  steps: number;
  /** Primes found so far. */
  found: number;
}

export interface SearchOptions {
  /** First step of the search. A group gives each task its own range. */
  from?: number;
  steps: number;
  /** Milliseconds between two steps. */
  pause: number;
  onStep?: (step: Step) => void;
}
