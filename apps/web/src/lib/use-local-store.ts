'use client';

import { useEffect, useState } from 'react';
import { readSeeded, storeEvent } from './local-store';

export function useLocalStore<T>(selector: () => T): T {
  const [value, setValue] = useState<T>(() => readSeeded(selector));
  useEffect(() => {
    const refresh = () => setValue(selector());
    refresh();
    window.addEventListener(storeEvent, refresh);
    window.addEventListener('storage', refresh);
    return () => {
      window.removeEventListener(storeEvent, refresh);
      window.removeEventListener('storage', refresh);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return value;
}
