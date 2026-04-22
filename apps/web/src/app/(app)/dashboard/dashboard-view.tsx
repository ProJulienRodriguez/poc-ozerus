'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import type { ChartPayload, EventItem, Kpi, Product } from '@/mocks/types';

export function DashboardView({ kpis, chart, events, products }: {
  kpis: Kpi[]; chart: ChartPayload; events: EventItem[]; products: Product[];
}) {
  const chartRef = useRef<any>(null);
  const tableRef = useRef<any>(null);
  const sparkRefs = useRef<Record<string, any>>({});
  const router = useRouter();

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
      const target = e.target as HTMLElement;
      const row = target.closest('tr');
      if (!row) return;
      const isin = row.querySelector<HTMLElement>('.cell.isin')?.textContent?.trim();
      if (isin) router.push(`/products/${isin}`);
    };
    el.addEventListener('click', onClick);
    return () => el.removeEventListener('click', onClick);
  }, [router]);

  return (
    <div>
      <div className="page-head">
        <div className="oz-micro oz-muted">Bienvenue</div>
        <h1 className="oz-h1">Vue d'ensemble</h1>
      </div>

      <div className="grid-4" style={{ marginBottom: 20 }}>
        {kpis.map(k => (
          <oz-kpi
            key={k.id}
            label={k.label}
            value={k.value}
            unit={k.unit}
            delta={k.delta}
            delta-tone={k.deltaTone}
            sub={k.sub}
          >
            {k.spark && (
              <oz-sparkline
                slot="chart"
                ref={(el: any) => { sparkRefs.current[k.id] = el; }}
                w={220}
                h={36}
                color={k.sparkColor ?? 'var(--oz-forest)'}
              />
            )}
          </oz-kpi>
        ))}
      </div>

      <oz-card heading="Valorisation sur 12 mois" subheading="Portefeuille vs. benchmark" style={{ marginBottom: 20, display: 'block' }}>
        <oz-line-chart ref={chartRef} w={1080} h={240} />
      </oz-card>

      <div className="split-main">
        <oz-card heading="Top produits" subheading="Positions les plus représentées" padding="none">
          <oz-product-table ref={tableRef} compact />
        </oz-card>

        <oz-card heading="Événements récents" subheading="30 derniers jours">
          {events.slice(0, 5).map(e => (
            <oz-event-row
              key={e.id}
              date-month={e.date.m}
              date-day={e.date.d}
              kind={e.kind}
              product={e.product}
              amount={e.amount}
              tone={e.tone}
            />
          ))}
        </oz-card>
      </div>
    </div>
  );
}
