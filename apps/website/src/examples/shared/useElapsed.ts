import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * A clock that is redrawn on every frame while it runs. The page draws it, so a number that keeps
 * changing is also the proof that the work of the example never blocks the page.
 */
export function useElapsed() {
  const [elapsed, setElapsed] = useState(0);
  const frame = useRef(0);

  const stop = useCallback(() => cancelAnimationFrame(frame.current), []);

  const start = useCallback(() => {
    const startedAt = performance.now();

    const tick = () => {
      setElapsed(performance.now() - startedAt);
      frame.current = requestAnimationFrame(tick);
    };

    cancelAnimationFrame(frame.current);
    setElapsed(0);
    frame.current = requestAnimationFrame(tick);
  }, []);

  useEffect(() => stop, [stop]);

  return { elapsed, start, stop };
}
