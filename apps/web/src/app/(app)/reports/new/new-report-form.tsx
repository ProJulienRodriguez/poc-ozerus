'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createReport } from '@/lib/local-store';
import type { ReportKind } from '@/mocks/types';

function useOzInput(defaultValue = ''): [string, (el: any) => void] {
  const [value, setValue] = useState(defaultValue);
  const ref = useRef<any>(null);
  const setRef = (el: any) => {
    if (ref.current === el) return;
    if (ref.current) ref.current.removeEventListener('ozInput', ref.current._ozHandler);
    ref.current = el;
    if (el) {
      const handler = (ev: CustomEvent<string>) => setValue(ev.detail);
      el._ozHandler = handler;
      el.addEventListener('ozInput', handler);
      el.value = value;
    }
  };
  return [value, setRef];
}

export function NewReportForm({ author }: { author: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [title, titleRef] = useOzInput('Valorisation Q2 2026 — ');
  const [kind, setKind] = useState<ReportKind>('valorisation');
  const [client, clientRef] = useOzInput('');
  const [period, periodRef] = useOzInput('Q2 2026');

  useEffect(() => { if ((titleRef as any).current) (titleRef as any).current.value = title; /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, []);
  useEffect(() => { if ((periodRef as any).current) (periodRef as any).current.value = period; /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, []);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    if (title.trim().length < 3) { setError('Titre trop court (min. 3 caractères).'); return; }
    if (client.trim().length < 2) { setError('Nom du client requis.'); return; }
    if (period.trim().length < 2) { setError('Période requise.'); return; }

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
    <oz-card heading="Nouveau reporting" padding="lg">
      <form onSubmit={onSubmit} className="stack" noValidate>
        <div className="grid-2">
          <oz-input ref={titleRef} label="Titre" placeholder="Ex : Valorisation Q2 2026 — Dupont" />
          <div>
            <div className="oz-micro oz-muted" style={{ marginBottom: 6 }}>Type</div>
            <select
              value={kind}
              onChange={(e) => setKind(e.target.value as ReportKind)}
              style={{
                width: '100%', height: 38, padding: '0 12px',
                background: 'var(--oz-white)', border: '1px solid var(--oz-line)',
                borderRadius: 'var(--oz-r-2)', fontFamily: 'var(--oz-font-sans)',
                fontSize: 14, color: 'var(--oz-ink)',
              }}
            >
              <option value="valorisation">Valorisation</option>
              <option value="mifid">MIFID II</option>
              <option value="performance">Performance</option>
              <option value="conformite">Conformité</option>
            </select>
          </div>
          <oz-input ref={clientRef} label="Client" placeholder="Nom du client" hint="Au moins 2 caractères" />
          <oz-input ref={periodRef} label="Période" placeholder="Q2 2026, Mars 2026, Annuel 2025…" />
        </div>
        {error && <div className="err">{error}</div>}
        <div className="row" style={{ justifyContent: 'flex-end' }}>
          <oz-button type="button" variant="ghost" onClick={() => router.push('/reports')}>Annuler</oz-button>
          <oz-button type="submit" variant="primary" disabled={pending || undefined}>
            <oz-icon slot="leading" name="check" size={14} />
            {pending ? 'Envoi…' : 'Générer'}
          </oz-button>
        </div>
      </form>
    </oz-card>
  );
}
