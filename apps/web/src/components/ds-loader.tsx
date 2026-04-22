'use client';

import { useEffect } from 'react';

let registered = false;

export function DsLoader() {
  useEffect(() => {
    if (registered || typeof window === 'undefined') return;
    registered = true;
    import('ozerus-ds/loader')
      .then(m => m.defineCustomElements(window))
      .catch(err => {
        registered = false;
        console.error('Failed to load Ozerus DS', err);
      });
  }, []);
  return null;
}
