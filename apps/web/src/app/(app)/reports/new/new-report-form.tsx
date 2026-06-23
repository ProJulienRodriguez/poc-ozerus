'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { createReport } from '@/lib/local-store';
import { useOzInput } from '@/lib/hooks/use-oz-input';
import type { ReportKind } from '@/mocks/types';

const REPORT_KINDS: ReportKind[] = ['valorisation', 'mifid', 'performance', 'conformite'];

const SELECT_STYLE = {
  width: '100%', height: 38, padding: '0 12px',
  background: 'var(--oz-white)', border: '1px solid var(--oz-line)',
  borderRadius: 'var(--oz-r-2)', fontFamily: 'var(--oz-font-sans)',
  fontSize: 14, color: 'var(--oz-ink)',
} as const;

function validateReportForm(values: { title: string; client: string; period: string }): string | null {
  if (values.title.trim().length < 3) return 'form.errors.titleTooShort';
  if (values.client.trim().length < 2) return 'form.errors.clientRequired';
  if (values.period.trim().length < 2) return 'form.errors.periodRequired';
  return null;
}

function ReportKindSelect({ value, onChange }: { value: ReportKind; onChange: (kind: ReportKind) => void }) {
  const t = useTranslations('reports');
  return (
    <div>
      <div className="oz-micro oz-muted" style={{ marginBottom: 6 }}>{t('form.typeLabel')}</div>
      <select value={value} onChange={e => onChange(e.target.value as ReportKind)} style={SELECT_STYLE}>
        {REPORT_KINDS.map(k => <option key={k} value={k}>{t(`kinds.${k}`)}</option>)}
      </select>
    </div>
  );
}

export function NewReportForm({ author }: { author: string }) {
  const t = useTranslations('reports');
  const tc = useTranslations('common');
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [title, titleRef] = useOzInput('Valorisation Q2 2026 — ');
  const [kind, setKind] = useState<ReportKind>('valorisation');
  const [client, clientRef] = useOzInput('');
  const [period, periodRef] = useOzInput('Q2 2026');

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const errorKey = validateReportForm({ title, client, period });
    if (errorKey) { setError(t(errorKey)); return; }

    setError(null);
    setPending(true);
    createReport({
      title: title.trim(),
      kind,
      client: client.trim(),
      period: period.trim(),
      author,
    });
    router.push('/reports');
  }

  return (
    <oz-card heading={t('newReport')} padding="lg">
      <form onSubmit={onSubmit} className="stack" noValidate>
        <div className="grid-2">
          <oz-input ref={titleRef} label={t('form.titleLabel')} placeholder={t('form.titlePlaceholder')} />
          <ReportKindSelect value={kind} onChange={setKind} />
          <oz-input ref={clientRef} label={t('form.clientLabel')} placeholder={t('form.clientPlaceholder')} hint={t('form.clientHint')} />
          <oz-input ref={periodRef} label={t('form.periodLabel')} placeholder={t('form.periodPlaceholder')} />
        </div>
        {error && <div className="err">{error}</div>}
        <div className="row" style={{ justifyContent: 'flex-end' }}>
          <oz-button type="button" variant="ghost" onClick={() => router.push('/reports')}>{tc('cancel')}</oz-button>
          <oz-button type="submit" variant="primary" disabled={pending || undefined}>
            <oz-icon slot="leading" name="check" size={14} />
            {pending ? t('form.submitting') : t('form.submit')}
          </oz-button>
        </div>
      </form>
    </oz-card>
  );
}
