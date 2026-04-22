'use client';

import Link from 'next/link';
import type { Product } from '@/mocks/types';
import { downloadText, sanitizeFilename } from '@/lib/file-download';

const DOCS = ['Term-sheet', 'KID (PRIIPs)', 'Prospectus de base', 'Final terms'];

export function ProductDetailView({ product }: { product: Product }) {
  const deltaColor = product.tone === 'danger' ? 'var(--oz-danger)'
    : product.tone === 'success' ? 'var(--oz-forest)' : 'var(--oz-ink-3)';

  const onDownloadDoc = (doc: string) => {
    const content = [
      `${doc} — ${product.name}`,
      '',
      `ISIN : ${product.isin}`,
      `Emetteur : ${product.issuer}`,
      `Devise : ${product.currency}`,
      `Coupon : ${product.coupon}`,
      `Protection : ${product.prot}`,
      `Maturité : ${product.matur}`,
      `Valorisation : ${product.val}`,
      '',
      'Description',
      '-----------',
      product.description,
      '',
      `Document de démonstration généré localement le ${new Date().toLocaleString('fr-FR')}.`,
    ].join('\n');
    downloadText(content, `${sanitizeFilename(product.name)}-${sanitizeFilename(doc)}.txt`);
  };

  return (
    <div>
      <div className="page-head">
        <div className="oz-micro oz-muted">
          <Link href="/products" style={{ color: 'var(--oz-forest-700)', textDecoration: 'underline' }}>Offre produits</Link>
          {' / '}{product.isin}
        </div>
        <h1 className="oz-h1" style={{ marginTop: 8 }}>{product.name}</h1>
        <div className="row" style={{ marginTop: 12 }}>
          <oz-tag tone="navy" variant="outline">{product.under}</oz-tag>
          <oz-tag tone="forest" variant="soft">{product.issuer}</oz-tag>
          <oz-tag tone="ochre" variant="soft">{product.currency}</oz-tag>
          <oz-tag tone="neutral" variant="soft" className="oz-mono">{product.isin}</oz-tag>
        </div>
      </div>

      <div className="grid-4" style={{ marginBottom: 20 }}>
        <oz-kpi label="Valorisation" value={product.val} unit={product.currency} delta={product.delta} delta-tone={product.tone === 'danger' ? 'danger' : product.tone === 'success' ? 'success' : 'neutral'} />
        <oz-kpi label="Coupon" value={product.coupon} sub="Annuel" />
        <oz-kpi label="Protection" value={product.prot} sub="Barrière" />
        <oz-kpi label="Maturité" value={product.matur} sub="Date finale" />
      </div>

      <div className="split-main">
        <oz-card heading="Description" subheading="Caractéristiques du produit">
          <p style={{ margin: 0, fontSize: 14, lineHeight: 1.6, color: 'var(--oz-ink-2)' }}>{product.description}</p>
        </oz-card>

        <oz-card heading="Documents" subheading="KID, term-sheet, prospectus">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {DOCS.map(doc => (
              <button
                key={doc}
                type="button"
                onClick={() => onDownloadDoc(doc)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '10px 12px', background: 'var(--oz-cream)',
                  borderRadius: 'var(--oz-r-2)',
                  border: '1px solid transparent',
                  cursor: 'pointer',
                  textAlign: 'left',
                  fontFamily: 'inherit',
                  transition: 'border-color 120ms, background 120ms',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--oz-forest-300)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'transparent'; }}
              >
                <oz-icon name="doc" size={14} color="var(--oz-ink-3)" />
                <span style={{ flex: 1, fontSize: 13, color: 'var(--oz-ink)' }}>{doc}</span>
                <oz-icon name="download" size={14} color="var(--oz-ink-3)" />
              </button>
            ))}
          </div>
        </oz-card>
      </div>

      <div style={{ marginTop: 24, display: 'flex', gap: 12, color: deltaColor, fontSize: 12 }}>
        <span className="oz-mono">Variation : {product.delta}</span>
      </div>
    </div>
  );
}
