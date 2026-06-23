'use client';

import { useCallback, useRef, useState } from 'react';

/** Message éphémère (notice) auto-effacé après `delay` ms. */
export function useFlash(delay = 3000): [string | null, (msg: string) => void] {
  const [message, setMessage] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const flash = useCallback(
    (msg: string) => {
      if (timer.current) clearTimeout(timer.current);
      setMessage(msg);
      timer.current = setTimeout(() => setMessage(null), delay);
    },
    [delay],
  );

  return [message, flash];
}
