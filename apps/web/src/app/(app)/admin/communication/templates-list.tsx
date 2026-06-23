'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { useTemplatesCatalog } from '@/lib/hooks/use-templates-catalog';
import type { TemplateTypeDefinition, TemplateTypeSummary } from '@/lib/communication-types';
import { TEMPLATE_STATUS_TONE } from '@/lib/ui/status-tone';

function TemplateCard({ def, summary }: { def: TemplateTypeDefinition; summary?: TemplateTypeSummary }) {
  const t = useTranslations('communication');
  const status = summary?.status ?? 'DRAFT';

  return (
    <Link href={`/admin/communication/${def.name}`} style={{ textDecoration: 'none', color: 'inherit' }}>
      <oz-card padding="lg" interactive>
        <div className="row" style={{ justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 }}>
          <div>
            <div className="row" style={{ gap: 8, alignItems: 'center' }}>
              <strong>{def.label}</strong>
              {def.protected && <oz-icon name="shield" size={12} color="var(--oz-ink-3)" />}
            </div>
            <div className="hint" style={{ marginTop: 4 }}>{def.description}</div>
            <div className="hint" style={{ marginTop: 6, fontSize: 11 }}>
              <code>{def.name}</code>
              {summary && ` · ${t('list.languages', { list: summary.locales.join(', ') })}`}
              {summary?.publishedVersion && ` · v${summary.publishedVersion}`}
            </div>
          </div>
          <div className="row" style={{ gap: 8, alignItems: 'center', whiteSpace: 'nowrap' }}>
            {summary?.hasDraft && status !== 'DRAFT' && (
              <span style={{ fontSize: 11, color: TEMPLATE_STATUS_TONE.DRAFT }}>{t('list.draftInProgress')}</span>
            )}
            <span style={{ fontSize: 12, fontWeight: 600, color: TEMPLATE_STATUS_TONE[status] }}>
              {summary ? t(`status.${status}`) : t('list.notCreated')}
            </span>
            <oz-icon name="arrow-right" size={14} />
          </div>
        </div>
      </oz-card>
    </Link>
  );
}

export function TemplatesList() {
  const tc = useTranslations('common');
  const { loading, error, catalog, byName } = useTemplatesCatalog(tc('loadError'));

  if (loading) return <oz-card padding="lg"><div className="hint">{tc('loading')}</div></oz-card>;
  if (error) return <oz-card padding="lg"><div className="err">{error}</div></oz-card>;

  return (
    <div className="stack" style={{ gap: 12 }}>
      {catalog.map((def) => (
        <TemplateCard key={def.name} def={def} summary={byName.get(def.name)} />
      ))}
    </div>
  );
}
