import { afterEach, beforeEach, vi } from 'vitest';

const { warn, error, info } = console;

const avoidConsoleError = true;
const avoidConsoleWarn = true;
const avoidConsoleInfo = true;

beforeEach(() => {
  // process.setUncaughtExceptionCaptureCallback(null);
  // process.setUncaughtExceptionCaptureCallback(() => {});

  vi.spyOn(console, 'warn').mockImplementation((...args) => {
    if (avoidConsoleWarn) return;

    warn(...args);
  });
  vi.spyOn(console, 'error').mockImplementation((...args) => {
    if (avoidConsoleError) return;

    error(...args);
  });
  vi.spyOn(console, 'info').mockImplementation((...args) => {
    if (avoidConsoleInfo) return;

    info(...args);
  });
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.clearAllMocks();
});

export {};
