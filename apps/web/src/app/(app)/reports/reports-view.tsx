'use client';

import Link from 'next/link';
import type { Report } from '@/mocks/types';
import { deleteReport, getReports } from '@/lib/local-store';
import { useLocalStore } from '@/lib/use-local-store';
import { downloadText, sanitizeFilename } from '@/lib/file-download';

const KIND_LABELS: Record<string, string> = {
  valorisation: 'Valorisation',
  mifid: 'MIFID II',
  performance: 'Performance',
  conformite: 'Conformité',
};

const STATUS_TONE: Record<string, string> = { ready: 'success', pending: 'warn', failed: 'danger' };
const STATUS_LABEL: Record<string, string> = { ready: 'Prêt', pending: 'En cours', failed: 'Échec' };

function renderReportContent(r: Report): string {
  return [
    `${r.title}`,
    ''.padEnd(r.title.length, '='),
    '',
    `Type        : ${KIND_LABELS[r.kind] ?? r.kind}`,
    `Client      : ${r.client}`,
    `Période     : ${r.period}`,
    `Date        : ${r.createdAt}`,
    `Auteur      : ${r.author}`,
    `Taille      : ${r.sizeKb} Ko`,
    `Statut      : ${STATUS_LABEL[r.status]}`,
    '',
    'Corps',
    '-----',
    "Ce document est un placeholder généré localement pour la démonstration du POC.",
    "Aucune donnée n'a été récupérée d'un back-end.",
  ].join('\n');
}

export function ReportsView() {
  const reports = useLocalStore(() => getReports());

  const onDownload = (r: Report) => {
    downloadText(renderReportContent(r), `${sanitizeFilename(r.title)}.txt`);
  };
  const onDelete = (r: Report) => {
    if (confirm(`Supprimer « ${r.title} » ?`)) deleteReport(r.id);
  };

  return (
    <div>
      <div className="page-head" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div className="oz-micro oz-muted">Production documentaire</div>
          <h1 className="oz-h1">Reporting</h1>
          <p className="hint" style={{ marginTop: 8 }}>
            {reports.length} reporting{reports.length > 1 ? 's' : ''} généré{reports.length > 1 ? 's' : ''} au total.
          </p>
        </div>
        <Link href="/reports/new">
          <oz-button variant="primary">
            <oz-icon slot="leading" name="plus" size={14} />
            Nouveau reporting
          </oz-button>
        </Link>
      </div>

      {reports.length === 0 ? (
        <oz-empty-state icon="doc" heading="Aucun reporting généré" body="Créez votre premier reporting client pour commencer.">
          <Link slot="action" href="/reports/new">
            <oz-button variant="primary" size="sm">
              <oz-icon slot="leading" name="plus" size={14} />Nouveau reporting
            </oz-button>
          </Link>
        </oz-empty-state>
      ) : (
        <oz-card padding="none">
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: 'var(--oz-cream)', borderBottom: '1px solid var(--oz-line)' }}>
                  {['Titre', 'Type', 'Client', 'Période', 'Date', 'Auteur', 'Statut', ''].map(h => (
                    <th key={h} style={{
                      textAlign: 'left', padding: '12px 16px',
                      fontWeight: 500, fontSize: 11,
                      letterSpacing: 0.06, textTransform: 'uppercase',
                      color: 'var(--oz-ink-3)', whiteSpace: 'nowrap',
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {reports.map((r, i) => (
                  <tr key={r.id} style={{
                    borderBottom: i < reports.length - 1 ? '1px solid var(--oz-line-2)' : 'none',
                  }}>
                    <td style={{ padding: '14px 16px', fontWeight: 500, color: 'var(--oz-ink)' }}>{r.title}</td>
                    <td style={{ padding: '14px 16px' }}>
                      <oz-tag tone="navy" variant="soft">{KIND_LABELS[r.kind] ?? r.kind}</oz-tag>
                    </td>
                    <td style={{ padding: '14px 16px', color: 'var(--oz-ink-2)' }}>{r.client}</td>
                    <td style={{ padding: '14px 16px', color: 'var(--oz-ink-2)' }}>{r.period}</td>
                    <td style={{ padding: '14px 16px', fontFamily: 'var(--oz-font-mono)', fontSize: 12, color: 'var(--oz-ink-2)' }}>{r.createdAt}</td>
                    <td style={{ padding: '14px 16px', color: 'var(--oz-ink-2)' }}>{r.author}</td>
                    <td style={{ padding: '14px 16px' }}>
                      <oz-tag tone={STATUS_TONE[r.status]} variant="soft">{STATUS_LABEL[r.status]}</oz-tag>
                    </td>
                    <td style={{ padding: '14px 16px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                      {r.status === 'ready' && (
                        <oz-button variant="ghost" size="sm" onClick={() => onDownload(r)} title="Télécharger">
                          <oz-icon slot="leading" name="download" size={14} />
                        </oz-button>
                      )}
                      <oz-button variant="ghost" size="sm" onClick={() => onDelete(r)} title="Supprimer">
                        <oz-icon slot="leading" name="x" size={14} />
                      </oz-button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </oz-card>
      )}
    </div>
  );
}
