'use client';

import { useRef, useState } from 'react';

/**
 * Lie la valeur d'un web component <oz-input> (event `ozInput`) à un state React.
 * Remplace les implémentations dupliquées des formulaires.
 *
 * @returns [value, setRef, setValue] — `setRef` à passer en `ref`, `setValue`
 *          met aussi à jour la valeur affichée par l'élément.
 */
export function useOzInput(
  defaultValue = '',
): [string, (el: any) => void, (v: string) => void] {
  const [value, setValue] = useState(defaultValue);
  const ref = useRef<any>(null);

  const setRef = (el: any) => {
    if (ref.current === el) return;
    if (ref.current?._ozHandler) {
      ref.current.removeEventListener('ozInput', ref.current._ozHandler);
    }
    ref.current = el;
    if (el) {
      const handler = (ev: CustomEvent<string>) => setValue(ev.detail);
      el._ozHandler = handler;
      el.addEventListener('ozInput', handler);
      el.value = value;
    }
  };

  const setExternal = (v: string) => {
    setValue(v);
    if (ref.current) ref.current.value = v;
  };

  return [value, setRef, setExternal];
}
