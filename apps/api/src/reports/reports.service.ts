import { Injectable } from '@nestjs/common';

export type ReportStatus = 'ready' | 'pending' | 'failed';
export type ReportKind = 'valorisation' | 'mifid' | 'performance' | 'conformite';

export interface Report {
  id: string;
  title: string;
  kind: ReportKind;
  client: string;
  period: string;
  createdAt: string;
  status: ReportStatus;
  sizeKb: number;
  author: string;
}

@Injectable()
export class ReportsService {
  private reports: Report[] = [
    { id: 'r-1001', title: 'Valorisation Q1 2026 — Dupont', kind: 'valorisation', client: 'Jean Dupont', period: 'Q1 2026', createdAt: '2026-04-04', status: 'ready', sizeKb: 312, author: 'Marie Laurent' },
    { id: 'r-1002', title: 'Reporting MIFID II — Martin', kind: 'mifid', client: 'Sophie Martin', period: 'Annuel 2025', createdAt: '2026-04-02', status: 'ready', sizeKb: 478, author: 'Marie Laurent' },
    { id: 'r-1003', title: 'Performance mensuelle — Petit', kind: 'performance', client: 'Luc Petit', period: 'Mars 2026', createdAt: '2026-04-01', status: 'ready', sizeKb: 204, author: 'Pierre Dubois' },
    { id: 'r-1004', title: 'Conformité onboarding — Roux', kind: 'conformite', client: 'Emma Roux', period: 'Q1 2026', createdAt: '2026-03-28', status: 'pending', sizeKb: 0, author: 'Marie Laurent' },
    { id: 'r-1005', title: 'Valorisation Q1 2026 — Garcia', kind: 'valorisation', client: 'Paul Garcia', period: 'Q1 2026', createdAt: '2026-03-25', status: 'failed', sizeKb: 0, author: 'Pierre Dubois' },
  ];

  list(): Report[] {
    return [...this.reports].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  get(id: string): Report | undefined {
    return this.reports.find(r => r.id === id);
  }

  create(input: { title: string; kind: ReportKind; client: string; period: string; author: string }): Report {
    const now = new Date();
    const report: Report = {
      id: `r-${1000 + this.reports.length + 1}`,
      title: input.title,
      kind: input.kind,
      client: input.client,
      period: input.period,
      createdAt: now.toISOString().slice(0, 10),
      status: 'pending',
      sizeKb: 0,
      author: input.author,
    };
    this.reports.unshift(report);
    setTimeout(() => {
      const target = this.reports.find(r => r.id === report.id);
      if (target) {
        target.status = 'ready';
        target.sizeKb = Math.round(200 + Math.random() * 400);
      }
    }, 2000);
    return report;
  }
}
