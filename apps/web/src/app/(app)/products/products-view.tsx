'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Product } from '@/mocks/types';
import { downloadCsv } from '@/lib/csv-export';

type Tone = Product['tone'] | 'all';

interface Filters {
  minCoupon: number;
  minProtection: number;
  issuer: string;
  tone: Tone;
}

const INITIAL_FILTERS: Filters = { minCoupon: 0, minProtection: 0, issuer: '', tone: 'all' };

const parsePct = (s: string) => Number.parseFloat(s.replace('%', '').replace(',', '.')) || 0;

export function ProductsView({ products }: { products: Product[] }) {
  const [q, setQ] = useState('');
  const [filters, setFilters] = useState<Filters>(INITIAL_FILTERS);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const tableRef = useRef<any>(null);
  const router = useRouter();

  const issuers = useMemo(() => Array.from(new Set(products.map(p => p.issuer))).sort(), [products]);

  const filtered = useMemo(() => {
    const n = q.trim().toLowerCase();
    return products.filter(p => {
      if (n && !(p.isin.toLowerCase().includes(n) || p.name.toLowerCase().includes(n) || p.under.toLowerCase().includes(n) || p.issuer.toLowerCase().includes(n))) return false;
      if (parsePct(p.coupon) < filters.minCoupon) return false;
      if (parsePct(p.prot) < filters.minProtection) return false;
      if (filters.issuer && p.issuer !== filters.issuer) return false;
      if (filters.tone !== 'all' && p.tone !== filters.tone) return false;
      return true;
    });
  }, [q, products, filters]);

  useEffect(() => {
    if (tableRef.current) tableRef.current.rows = filtered;
  }, [filtered]);

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

  const activeFilterCount = (filters.minCoupon > 0 ? 1 : 0) + (filters.minProtection > 0 ? 1 : 0) + (filters.issuer ? 1 : 0) + (filters.tone !== 'all' ? 1 : 0);

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
        <div className="oz-micro oz-muted">Catalogue</div>
        <h1 className="oz-h1">Offre produits</h1>
        <p className="hint" style={{ marginTop: 8, maxWidth: 640 }}>
          {filtered.length} produit{filtered.length > 1 ? 's' : ''} référencé{filtered.length > 1 ? 's' : ''}. Cliquez une ligne pour voir le détail.
        </p>
      </div>

      <oz-card padding="sm" style={{ marginBottom: 16, display: 'block' }}>
        <div className="row">
          <div style={{ flex: 1, minWidth: 260 }}>
            <oz-input
              size="sm"
              placeholder="Rechercher un ISIN, produit, sous-jacent, émetteur…"
              value={q}
              onInput={(e: any) => setQ(e.target.value)}
            >
              <oz-icon slot="leading" name="search" size={14} />
            </oz-input>
          </div>
          <oz-button variant="outline" size="sm" onClick={() => setFiltersOpen(v => !v)}>
            <oz-icon slot="leading" name="filter" size={14} />
            Filtres{activeFilterCount > 0 ? ` (${activeFilterCount})` : ''}
          </oz-button>
          <oz-button variant="outline" size="sm" onClick={onExport}>
            <oz-icon slot="leading" name="download" size={14} />Exporter CSV
          </oz-button>
        </div>

        {filtersOpen && (
          <div style={{
            marginTop: 14, paddingTop: 14,
            borderTop: '1px solid var(--oz-line-2)',
            display: 'grid', gap: 14,
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          }}>
            <label style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12, color: 'var(--oz-ink-3)' }}>
              Coupon minimum : <b style={{ color: 'var(--oz-ink)' }}>{filters.minCoupon}%</b>
              <input type="range" min={0} max={12} step={0.5} value={filters.minCoupon}
                onChange={e => setFilters(f => ({ ...f, minCoupon: Number(e.target.value) }))} />
            </label>
            <label style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12, color: 'var(--oz-ink-3)' }}>
              Protection min. : <b style={{ color: 'var(--oz-ink)' }}>{filters.minProtection}%</b>
              <input type="range" min={0} max={100} step={5} value={filters.minProtection}
                onChange={e => setFilters(f => ({ ...f, minProtection: Number(e.target.value) }))} />
            </label>
            <label style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12, color: 'var(--oz-ink-3)' }}>
              Emetteur
              <select value={filters.issuer} onChange={e => setFilters(f => ({ ...f, issuer: e.target.value }))}
                style={{ height: 34, padding: '0 10px', border: '1px solid var(--oz-line)', borderRadius: 'var(--oz-r-2)', background: 'var(--oz-white)', fontFamily: 'inherit', fontSize: 13 }}>
                <option value="">Tous</option>
                {issuers.map(i => <option key={i} value={i}>{i}</option>)}
              </select>
            </label>
            <label style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12, color: 'var(--oz-ink-3)' }}>
              Performance
              <select value={filters.tone} onChange={e => setFilters(f => ({ ...f, tone: e.target.value as Tone }))}
                style={{ height: 34, padding: '0 10px', border: '1px solid var(--oz-line)', borderRadius: 'var(--oz-r-2)', background: 'var(--oz-white)', fontFamily: 'inherit', fontSize: 13 }}>
                <option value="all">Toutes</option>
                <option value="success">Positive</option>
                <option value="neutral">Stable</option>
                <option value="danger">Négative</option>
              </select>
            </label>
            <div style={{ display: 'flex', alignItems: 'end' }}>
              <oz-button variant="ghost" size="sm" onClick={() => setFilters(INITIAL_FILTERS)}>Réinitialiser</oz-button>
            </div>
          </div>
        )}
      </oz-card>

      <oz-product-table ref={tableRef} />
    </div>
  );
}
