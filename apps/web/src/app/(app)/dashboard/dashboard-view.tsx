'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import type { ChartPayload, EventItem, Kpi, Product } from '@/mocks/types';
import { useDashboardRefs } from '@/lib/hooks/use-dashboard-refs';

function KpiGrid({ kpis, setSparkRef }: { kpis: Kpi[]; setSparkRef: (id: string, el: any) => void }) {
  return (
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
              ref={(el: any) => setSparkRef(k.id, el)}
              w={220}
              h={36}
              color={k.sparkColor ?? 'var(--oz-forest)'}
            />
          )}
        </oz-kpi>
      ))}
    </div>
  );
}

function EventsList({ events, onSelect }: { events: EventItem[]; onSelect: (event: EventItem) => void }) {
  return (
    <>
      {events.slice(0, 5).map(e => (
        <div
          key={e.id}
          role="button"
          tabIndex={0}
          onClick={() => onSelect(e)}
          onKeyDown={ev => { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); onSelect(e); } }}
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
    </>
  );
}

export function DashboardView({ kpis, chart, events, products }: {
  kpis: Kpi[]; chart: ChartPayload; events: EventItem[]; products: Product[];
}) {
  const t = useTranslations('dashboard');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<EventItem | null>(null);
  const { chartRef, tableRef, setSparkRef } = useDashboardRefs({
    kpis,
    chart,
    products,
    onProductSelect: setSelectedProduct,
  });

  return (
    <div>
      <div className="page-head">
        <div className="oz-micro oz-muted">{t('eyebrow')}</div>
        <h1 className="oz-h1">{t('title')}</h1>
      </div>

      <KpiGrid kpis={kpis} setSparkRef={setSparkRef} />

      <oz-card heading={t('chart.heading')} subheading={t('chart.subheading')} style={{ marginBottom: 20, display: 'block' }}>
        <oz-line-chart ref={chartRef} w={1080} h={240} />
      </oz-card>

      <div className="split-main split-main--equal">
        <oz-card heading={t('topProducts.heading')} subheading={t('topProducts.subheading')} padding="none" style={{ height: '100%' }}>
          <oz-product-table ref={tableRef} compact />
        </oz-card>

        <oz-card heading={t('events.heading')} subheading={t('events.subheading')} style={{ height: '100%' }}>
          <EventsList events={events} onSelect={setSelectedEvent} />
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
  const t = useTranslations('product');
  const tc = useTranslations('common');
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
          <button type="button" onClick={onClose} aria-label={tc('close')}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 8, color: 'var(--oz-ink-3)' }}>
            <oz-icon name="x" size={18} />
          </button>
        </div>

        <div style={{ padding: 24, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12 }}>
          <oz-kpi label={t('valuation')} value={product.val} unit={product.currency} delta={product.delta} delta-tone={product.tone === 'danger' ? 'danger' : product.tone === 'success' ? 'success' : 'neutral'} />
          <oz-kpi label={t('coupon')} value={product.coupon} sub={t('annual')} />
          <oz-kpi label={t('protection')} value={product.prot} sub={t('barrier')} />
          <oz-kpi label={t('maturity')} value={product.matur} sub={t('finalDate')} />
        </div>

        <div style={{ padding: '0 24px 24px' }}>
          <div className="oz-micro oz-muted" style={{ marginBottom: 8 }}>{t('description')}</div>
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
  const t = useTranslations('dashboard');
  const tc = useTranslations('common');
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
          <button type="button" onClick={onClose} aria-label={tc('close')}
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
            {t('events.sentence', { kind: event.kind, day: event.date.d, month: event.date.m, product: event.product })}
          </p>
        </div>
      </div>
    </div>
  );
}
