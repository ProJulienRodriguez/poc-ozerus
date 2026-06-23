'use client';

import { useEffect, useRef } from 'react';
import type { ChartPayload, Kpi, Product } from '@/mocks/types';
import { PRODUCTS } from '@/mocks/products';

/**
 * Encapsule le câblage impératif des web-components du dashboard :
 * - alimentation des sparklines / line-chart / product-table à chaque changement de données ;
 * - délégation du clic sur une ligne de la table vers `onProductSelect`.
 * Retourne les refs à brancher dans le JSX et un setter de ref pour les sparklines.
 */
export function useDashboardRefs({
  kpis,
  chart,
  products,
  onProductSelect,
}: {
  kpis: Kpi[];
  chart: ChartPayload;
  products: Product[];
  onProductSelect: (product: Product) => void;
}) {
  const chartRef = useRef<any>(null);
  const tableRef = useRef<any>(null);
  const sparkRefs = useRef<Record<string, any>>({});

  const setSparkRef = (id: string, el: any) => {
    sparkRefs.current[id] = el;
  };

  useEffect(() => {
    kpis.forEach(k => {
      const el = sparkRefs.current[k.id];
      if (el && k.spark) el.data = k.spark;
    });
    if (chartRef.current) {
      chartRef.current.series = chart.series;
      chartRef.current.yLabels = chart.labels;
    }
    if (tableRef.current) {
      tableRef.current.rows = products;
    }
  }, [kpis, chart, products]);

  useEffect(() => {
    const el = tableRef.current;
    if (!el) return;
    const onClick = (e: Event) => {
      const path = (e as any).composedPath?.() ?? [];
      const row = path.find((n: any) => n?.tagName === 'TR');
      if (!row) return;
      const isin = row.querySelector?.('.cell.isin')?.textContent?.trim();
      if (!isin) return;
      const product = products.find(p => p.isin === isin) ?? PRODUCTS.find(p => p.isin === isin);
      if (product) onProductSelect(product);
    };
    el.addEventListener('click', onClick);
    return () => el.removeEventListener('click', onClick);
  }, [products, onProductSelect]);

  return { chartRef, tableRef, setSparkRef };
}
