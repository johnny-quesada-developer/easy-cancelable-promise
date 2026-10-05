/** How long the work of an example lasts, in seconds. Long enough to watch it and to stop it. */
export const DURATIONS = [2, 3, 4] as const;

export type Duration = (typeof DURATIONS)[number];

export const DEFAULT_DURATION: Duration = 3;
