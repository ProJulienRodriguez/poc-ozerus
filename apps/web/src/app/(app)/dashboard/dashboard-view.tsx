'use client';

import { useEffect, useRef, useState } from 'react';
import type { ChartPayload, EventItem, Kpi, Product } from '@/mocks/types';
import { PRODUCTS } from '@/mocks/products';

export function DashboardView({ kpis, chart, events, products }: {
  kpis: Kpi[]; chart: ChartPayload; events: EventItem[]; products: Product[];
}) {
  const chartRef = useRef<any>(null);
  const tableRef = useRef<any>(null);
  const sparkRefs = useRef<Record<string, any>>({});
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<EventItem | null>(null);

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
      if (product) setSelectedProduct(product);
    };
    el.addEventListener('click', onClick);
    return () => el.removeEventListener('click', onClick);
  }, [products]);

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

      <div className="split-main split-main--equal">
        <oz-card heading="Top produits" subheading="Positions les plus représentées" padding="none" style={{ height: '100%' }}>
          <oz-product-table ref={tableRef} compact />
        </oz-card>

        <oz-card heading="Événements récents" subheading="30 derniers jours" style={{ height: '100%' }}>
          {events.slice(0, 5).map(e => (
            <div
              key={e.id}
              role="button"
              tabIndex={0}
              onClick={() => setSelectedEvent(e)}
              onKeyDown={ev => { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); setSelectedEvent(e); } }}
              style={{ cursor: 'pointer', borderRadius: 'var(--oz-r-2)' }}
            >
              <oz-event-row
                date-month={e.date.m}
                date-day={e.date.d}
                kind={e.kind}
                product={e.product}
                amount={e.amount}
                tone={e.tone}
              />
            </div>
          ))}
        </oz-card>
      </div>

      {selectedProduct && (
        <ProductDetailModal product={selectedProduct} onClose={() => setSelectedProduct(null)} />
      )}
      {selectedEvent && (
        <EventDetailModal event={selectedEvent} onClose={() => setSelectedEvent(null)} />
      )}
    </div>
  );
}

function ProductDetailModal({ product, onClose }: { product: Product; onClose: () => void }) {
  const deltaColor = product.tone === 'danger' ? 'var(--oz-danger)'
    : product.tone === 'success' ? 'var(--oz-forest)' : 'var(--oz-ink-3)';

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(31,29,27,0.5)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 16, zIndex: 100,
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: 'var(--oz-white)',
          borderRadius: 'var(--oz-r-4)',
          maxWidth: 720, width: '100%', maxHeight: '90vh',
          overflow: 'auto',
          boxShadow: 'var(--oz-sh-3)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '20px 24px', borderBottom: '1px solid var(--oz-line)' }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 18, fontWeight: 500 }}>{product.name}</div>
            <div className="oz-mono" style={{ fontSize: 12, color: 'var(--oz-ink-3)' }}>{product.isin} · {product.under}</div>
          </div>
          <button type="button" onClick={onClose} aria-label="Fermer"
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 8, color: 'var(--oz-ink-3)' }}>
            <oz-icon name="x" size={18} />
          </button>
        </div>

        <div style={{ padding: 24, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12 }}>
          <oz-kpi label="Valorisation" value={product.val} unit={product.currency} delta={product.delta} delta-tone={product.tone === 'danger' ? 'danger' : product.tone === 'success' ? 'success' : 'neutral'} />
          <oz-kpi label="Coupon" value={product.coupon} sub="Annuel" />
          <oz-kpi label="Protection" value={product.prot} sub="Barrière" />
          <oz-kpi label="Maturité" value={product.matur} sub="Date finale" />
        </div>

        <div style={{ padding: '0 24px 24px' }}>
          <div className="oz-micro oz-muted" style={{ marginBottom: 8 }}>Description</div>
          <p style={{ margin: 0, fontSize: 14, lineHeight: 1.6, color: 'var(--oz-ink-2)' }}>{product.description}</p>
          <div className="row" style={{ marginTop: 16 }}>
            <oz-tag tone="forest" variant="soft">{product.issuer}</oz-tag>
            <oz-tag tone="ochre" variant="soft">{product.currency}</oz-tag>
            <span className="oz-mono" style={{ fontSize: 12, color: deltaColor }}>{product.delta}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function EventDetailModal({ event, onClose }: { event: EventItem; onClose: () => void }) {
  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(31,29,27,0.5)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 16, zIndex: 100,
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: 'var(--oz-white)',
          borderRadius: 'var(--oz-r-4)',
          maxWidth: 520, width: '100%', maxHeight: '90vh',
          overflow: 'auto',
          boxShadow: 'var(--oz-sh-3)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '20px 24px', borderBottom: '1px solid var(--oz-line)' }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 18, fontWeight: 500 }}>{event.product}</div>
            <div className="oz-micro oz-muted" style={{ marginTop: 2 }}>{event.date.d} {event.date.m}</div>
          </div>
          <button type="button" onClick={onClose} aria-label="Fermer"
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 8, color: 'var(--oz-ink-3)' }}>
            <oz-icon name="x" size={18} />
          </button>
        </div>

        <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div className="row">
            <oz-tag tone={event.tone} variant="soft">{event.kind}</oz-tag>
            <span className="oz-mono" style={{ fontSize: 14 }}>{event.amount}</span>
          </div>
          <p style={{ margin: 0, fontSize: 13, lineHeight: 1.6, color: 'var(--oz-ink-2)' }}>
            Événement « {event.kind} » enregistré le {event.date.d} {event.date.m} sur le produit {event.product}.
          </p>
        </div>
      </div>
    </div>
  );
}
