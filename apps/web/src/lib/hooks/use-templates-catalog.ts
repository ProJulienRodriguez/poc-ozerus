'use client';

import { useEffect, useMemo, useState } from 'react';
import { communicationApi } from '@/lib/api/communication-api';
import type { TemplateTypeDefinition, TemplateTypeSummary } from '@/lib/communication-types';

/**
 * Charge le catalogue de types de templates + leurs résumés, et expose
 * l'état `loading` / `error` ainsi qu'une `Map` `byName` prête pour le rendu.
 */
export function useTemplatesCatalog(fallbackMessage = 'Erreur.') {
  const [types, setTypes] = useState<TemplateTypeSummary[]>([]);
  const [catalog, setCatalog] = useState<TemplateTypeDefinition[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    Promise.all([communicationApi.listTypes(), communicationApi.getCatalog()])
      .then(([listed, cat]) => {
        if (cancelled) return;
        setTypes(listed);
        setCatalog(cat);
      })
      .catch((e: any) => {
        if (!cancelled) setError(e?.message ?? fallbackMessage);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [fallbackMessage]);

  const byName = useMemo(() => new Map(types.map((x) => [x.name, x])), [types]);

  return { loading, error, catalog, byName };
}
