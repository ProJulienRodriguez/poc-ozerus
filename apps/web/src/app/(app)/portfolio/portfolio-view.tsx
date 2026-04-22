'use client';

import { useState } from 'react';
import type { PortfolioPosition, PortfolioSummary } from '@/mocks/types';
import { PRODUCTS } from '@/mocks/products';
import { downloadCsv } from '@/lib/csv-export';

const fmtEur = (n: number) => new Intl.NumberFormat('fr-FR').format(n);

export function PortfolioView({ summary }: { summary: PortfolioSummary }) {
  const [selected, setSelected] = useState<PortfolioPosition | null>(null);

  const onExport = () => {
    const rows = summary.positions.map(p => ({
      Client: p.client,
      Encours_EUR: p.aum,
      Produits: p.products,
    }));
    downloadCsv(rows, `portefeuilles-${new Date().toISOString().slice(0, 10)}.csv`);
  };

  return (
    <div>
      <div className="page-head" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div className="oz-micro oz-muted">Analyse globale</div>
          <h1 className="oz-h1">Portefeuilles</h1>
        </div>
        <oz-button variant="outline" size="sm" onClick={onExport}>
          <oz-icon slot="leading" name="download" size={14} />Exporter CSV
        </oz-button>
      </div>
      <div className="grid-3" style={{ marginBottom: 20 }}>
        <oz-kpi label="Encours total" value={fmtEur(Math.round(summary.totalAum / 1e6 * 10) / 10)} unit="M€" sub="Sous gestion" />
        <oz-kpi label="Clients" value={String(summary.clients)} sub="Actifs ce mois" />
        <oz-kpi label="Coupon moyen" value={summary.avgCoupon.toFixed(2)} unit="%" sub="Toutes positions" />
      </div>
      <oz-card heading="Positions par client" subheading={`${summary.positions.length} positions`} padding="none">
        <div style={{ padding: '8px 0' }}>
          {summary.positions.map((p, i) => (
            <button
              key={p.client}
              type="button"
              onClick={() => setSelected(p)}
              style={{
                display: 'flex', alignItems: 'center', gap: 16,
                padding: '14px 20px',
                width: '100%',
                textAlign: 'left',
                background: 'none',
                border: 'none',
                borderBottom: i < summary.positions.length - 1 ? '1px solid var(--oz-line-2)' : 'none',
                cursor: 'pointer',
                fontFamily: 'inherit',
                transition: 'background 120ms',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'var(--oz-cream)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'none'; }}
            >
              <oz-avatar name={p.client} size={36} tone="forest" />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 500 }}>{p.client}</div>
                <div style={{ fontSize: 11, color: 'var(--oz-ink-3)' }}>{p.products} produit{p.products > 1 ? 's' : ''}</div>
              </div>
              <div className="oz-mono" style={{ fontSize: 15, fontWeight: 500 }}>{fmtEur(p.aum)} €</div>
              <oz-icon name="arrow-right" size={14} color="var(--oz-ink-4)" />
            </button>
          ))}
        </div>
      </oz-card>

      {selected && <ClientDetailModal position={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}

function ClientDetailModal({ position, onClose }: { position: PortfolioPosition; onClose: () => void }) {
  const holdings = PRODUCTS.slice(0, position.products);
  const avgCoupon = holdings.reduce((acc, p) => acc + Number.parseFloat(p.coupon.replace('%', '').replace(',', '.')), 0) / (holdings.length || 1);

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
          <oz-avatar name={position.client} size={44} tone="forest" />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 18, fontWeight: 500 }}>{position.client}</div>
            <div style={{ fontSize: 12, color: 'var(--oz-ink-3)' }}>{position.products} produit{position.products > 1 ? 's' : ''} en portefeuille</div>
          </div>
          <button type="button" onClick={onClose} aria-label="Fermer"
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 8, color: 'var(--oz-ink-3)' }}>
            <oz-icon name="x" size={18} />
          </button>
        </div>

        <div style={{ padding: 24, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12 }}>
          <oz-kpi label="Encours" value={fmtEur(position.aum)} unit="€" />
          <oz-kpi label="Produits détenus" value={String(position.products)} />
          <oz-kpi label="Coupon moyen" value={avgCoupon.toFixed(2)} unit="%" />
        </div>

        <div style={{ padding: '0 24px 24px' }}>
          <div className="oz-micro oz-muted" style={{ marginBottom: 8 }}>Positions détaillées</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {holdings.map(p => (
              <div key={p.isin} style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '12px 14px', background: 'var(--oz-cream)',
                borderRadius: 'var(--oz-r-2)',
              }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 500 }}>{p.name}</div>
                  <div className="oz-mono" style={{ fontSize: 11, color: 'var(--oz-ink-3)' }}>{p.isin} · {p.under}</div>
                </div>
                <oz-tag tone={p.tone === 'danger' ? 'danger' : p.tone === 'success' ? 'forest' : 'neutral'} variant="soft">{p.coupon}</oz-tag>
                <div className="oz-mono" style={{ fontSize: 13, color: p.tone === 'danger' ? 'var(--oz-danger)' : p.tone === 'success' ? 'var(--oz-forest)' : 'var(--oz-ink-3)' }}>{p.delta}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
