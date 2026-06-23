'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import type { Product } from '@/mocks/types';

/**
 * Câble le web-component `oz-product-table` : alimente ses lignes à chaque
 * changement de `rows` et redirige vers la fiche produit au clic sur une ligne.
 * Retourne la ref à brancher sur la table.
 */
export function useProductTable(rows: Product[]) {
  const tableRef = useRef<any>(null);
  const router = useRouter();

  useEffect(() => {
    if (tableRef.current) tableRef.current.rows = rows;
  }, [rows]);

  useEffect(() => {
    const el = tableRef.current;
    if (!el) return;
    const onClick = (e: Event) => {
      const target = e.target as HTMLElement;
      const row = target.closest('tr');
      if (!row) return;
      const isin = row.querySelector<HTMLElement>('.cell.isin')?.textContent?.trim();
      if (isin) router.push(`/products/${isin}`);
    };
    el.addEventListener('click', onClick);
    return () => el.removeEventListener('click', onClick);
  }, [router]);

  return tableRef;
}
