'use client';

import { useState, type Dispatch, type SetStateAction } from 'react';
import { useTranslations } from 'next-intl';
import type { Product } from '@/mocks/types';
import { downloadCsv } from '@/lib/csv-export';
import { useProductFilters, type Filters, type Tone } from '@/lib/hooks/use-product-filters';
import { useProductTable } from '@/lib/hooks/use-product-table';

const SELECT_STYLE = {
  height: 34,
  padding: '0 10px',
  border: '1px solid var(--oz-line)',
  borderRadius: 'var(--oz-r-2)',
  background: 'var(--oz-white)',
  fontFamily: 'inherit',
  fontSize: 13,
} as const;

const FIELD_STYLE = { display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12, color: 'var(--oz-ink-3)' } as const;

function ProductFilters({ filters, setFilters, issuers, onReset }: {
  filters: Filters;
  setFilters: Dispatch<SetStateAction<Filters>>;
  issuers: string[];
  onReset: () => void;
}) {
  const t = useTranslations('products');
  const tc = useTranslations('common');

  return (
    <div style={{
      marginTop: 14, paddingTop: 14,
      borderTop: '1px solid var(--oz-line-2)',
      display: 'grid', gap: 14,
      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    }}>
      <label style={FIELD_STYLE}>
        {t('filters.minCoupon')} : <b style={{ color: 'var(--oz-ink)' }}>{filters.minCoupon}%</b>
        <input type="range" min={0} max={12} step={0.5} value={filters.minCoupon}
          onChange={e => setFilters(f => ({ ...f, minCoupon: Number(e.target.value) }))} />
      </label>
      <label style={FIELD_STYLE}>
        {t('filters.minProtection')} : <b style={{ color: 'var(--oz-ink)' }}>{filters.minProtection}%</b>
        <input type="range" min={0} max={100} step={5} value={filters.minProtection}
          onChange={e => setFilters(f => ({ ...f, minProtection: Number(e.target.value) }))} />
      </label>
      <label style={FIELD_STYLE}>
        {t('filters.issuer')}
        <select value={filters.issuer} onChange={e => setFilters(f => ({ ...f, issuer: e.target.value }))} style={SELECT_STYLE}>
          <option value="">{tc('all')}</option>
          {issuers.map(i => <option key={i} value={i}>{i}</option>)}
        </select>
      </label>
      <label style={FIELD_STYLE}>
        {t('filters.performance')}
        <select value={filters.tone} onChange={e => setFilters(f => ({ ...f, tone: e.target.value as Tone }))} style={SELECT_STYLE}>
          <option value="all">{tc('allFeminine')}</option>
          <option value="success">{t('performance.positive')}</option>
          <option value="neutral">{t('performance.stable')}</option>
          <option value="danger">{t('performance.negative')}</option>
        </select>
      </label>
      <div style={{ display: 'flex', alignItems: 'end' }}>
        <oz-button variant="ghost" size="sm" onClick={onReset}>{tc('reset')}</oz-button>
      </div>
    </div>
  );
}

export function ProductsView({ products }: { products: Product[] }) {
  const t = useTranslations('products');
  const { q, setQ, filters, setFilters, issuers, filtered, activeFilterCount, reset } = useProductFilters(products);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const tableRef = useProductTable(filtered);

  const onExport = () => {
    const rows = filtered.map(p => ({
      ISIN: p.isin, Nom: p.name, 'Sous-jacent': p.under, Emetteur: p.issuer,
      Devise: p.currency, Coupon: p.coupon, Protection: p.prot, Maturite: p.matur,
      Valorisation: p.val, Variation: p.delta,
    }));
    downloadCsv(rows, `produits-${new Date().toISOString().slice(0, 10)}.csv`);
  };

  return (
    <div>
      <div className="page-head">
        <div className="oz-micro oz-muted">{t('eyebrow')}</div>
        <h1 className="oz-h1">{t('title')}</h1>
        <p className="hint" style={{ marginTop: 8, maxWidth: 640 }}>
          {t('countHint', { count: filtered.length })}
        </p>
      </div>

      <oz-card padding="sm" style={{ marginBottom: 16, display: 'block' }}>
        <div className="row">
          <div style={{ flex: 1, minWidth: 260 }}>
            <oz-input
              size="sm"
              placeholder={t('searchPlaceholder')}
              value={q}
              onInput={(e: any) => setQ(e.target.value)}
            >
              <oz-icon slot="leading" name="search" size={14} />
            </oz-input>
          </div>
          <oz-button variant="outline" size="sm" onClick={() => setFiltersOpen(v => !v)}>
            <oz-icon slot="leading" name="filter" size={14} />
            {t('filters.toggle')}{activeFilterCount > 0 ? ` (${activeFilterCount})` : ''}
          </oz-button>
          <oz-button variant="outline" size="sm" onClick={onExport}>
            <oz-icon slot="leading" name="download" size={14} />{t('exportCsv')}
          </oz-button>
        </div>

        {filtersOpen && (
          <ProductFilters filters={filters} setFilters={setFilters} issuers={issuers} onReset={reset} />
        )}
      </oz-card>

      <oz-product-table ref={tableRef} />
    </div>
  );
}
