'use client';

import { useMemo, useState } from 'react';
import type { Product } from '@/mocks/types';

export type Tone = Product['tone'] | 'all';

export interface Filters {
  minCoupon: number;
  minProtection: number;
  issuer: string;
  tone: Tone;
}

export const INITIAL_PRODUCT_FILTERS: Filters = { minCoupon: 0, minProtection: 0, issuer: '', tone: 'all' };

const parsePct = (s: string) => Number.parseFloat(s.replace('%', '').replace(',', '.')) || 0;

function matchesQuery(p: Product, needle: string) {
  if (!needle) return true;
  return (
    p.isin.toLowerCase().includes(needle) ||
    p.name.toLowerCase().includes(needle) ||
    p.under.toLowerCase().includes(needle) ||
    p.issuer.toLowerCase().includes(needle)
  );
}

function matchesFilters(p: Product, filters: Filters) {
  if (parsePct(p.coupon) < filters.minCoupon) return false;
  if (parsePct(p.prot) < filters.minProtection) return false;
  if (filters.issuer && p.issuer !== filters.issuer) return false;
  if (filters.tone !== 'all' && p.tone !== filters.tone) return false;
  return true;
}

/**
 * Recherche texte + filtres avancés sur une liste de produits.
 * Expose l'état des filtres, la liste filtrée mémoïsée, la liste des émetteurs,
 * le nombre de filtres actifs et un reset.
 */
export function useProductFilters(products: Product[]) {
  const [q, setQ] = useState('');
  const [filters, setFilters] = useState<Filters>(INITIAL_PRODUCT_FILTERS);

  const issuers = useMemo(() => Array.from(new Set(products.map(p => p.issuer))).sort(), [products]);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return products.filter(p => matchesQuery(p, needle) && matchesFilters(p, filters));
  }, [q, products, filters]);

  const activeFilterCount =
    (filters.minCoupon > 0 ? 1 : 0) +
    (filters.minProtection > 0 ? 1 : 0) +
    (filters.issuer ? 1 : 0) +
    (filters.tone !== 'all' ? 1 : 0);

  const reset = () => setFilters(INITIAL_PRODUCT_FILTERS);

  return { q, setQ, filters, setFilters, issuers, filtered, activeFilterCount, reset };
}
