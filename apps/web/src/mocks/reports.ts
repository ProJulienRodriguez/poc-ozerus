import type { Report } from './types';

export const REPORTS: Report[] = [
  { id: 'r-1001', title: 'Valorisation Q1 2026 — Dupont', kind: 'valorisation', client: 'Jean Dupont', period: 'Q1 2026', createdAt: '2026-04-04', status: 'ready', sizeKb: 312, author: 'Marie Laurent' },
  { id: 'r-1002', title: 'Reporting MIFID II — Martin', kind: 'mifid', client: 'Sophie Martin', period: 'Annuel 2025', createdAt: '2026-04-02', status: 'ready', sizeKb: 478, author: 'Marie Laurent' },
  { id: 'r-1003', title: 'Performance mensuelle — Petit', kind: 'performance', client: 'Luc Petit', period: 'Mars 2026', createdAt: '2026-04-01', status: 'ready', sizeKb: 204, author: 'Pierre Dubois' },
  { id: 'r-1004', title: 'Conformité onboarding — Roux', kind: 'conformite', client: 'Emma Roux', period: 'Q1 2026', createdAt: '2026-03-28', status: 'pending', sizeKb: 0, author: 'Marie Laurent' },
  { id: 'r-1005', title: 'Valorisation Q1 2026 — Garcia', kind: 'valorisation', client: 'Paul Garcia', period: 'Q1 2026', createdAt: '2026-03-25', status: 'failed', sizeKb: 0, author: 'Pierre Dubois' },
];
