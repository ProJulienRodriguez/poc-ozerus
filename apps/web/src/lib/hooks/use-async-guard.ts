'use client';

import { useState } from 'react';

/**
 * Encapsule l'exécution d'une action asynchrone avec gestion `busy` + `error`.
 * Remplace les wrappers `guard()` répétés dans les vues.
 */
export function useAsyncGuard(fallbackMessage = 'Erreur.') {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run(fn: () => Promise<unknown>): Promise<void> {
    setBusy(true);
    setError(null);
    try {
      await fn();
    } catch (e: any) {
      setError(e?.message ?? fallbackMessage);
    } finally {
      setBusy(false);
    }
  }

  return { busy, error, setError, run };
}
