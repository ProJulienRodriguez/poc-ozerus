import type { Notification } from './types';

export const NOTIFICATIONS: Notification[] = [
  { id: 'n-1', title: 'Coupon détaché', body: 'Autocall Eurostoxx Q3 — +2 412 € crédités sur 1 position.', date: '2026-04-23', read: false, tone: 'forest' },
  { id: 'n-2', title: 'Nouveau reporting prêt', body: 'Valorisation Q1 2026 — Dupont est disponible au téléchargement.', date: '2026-04-04', read: false, tone: 'ochre' },
  { id: 'n-3', title: 'Barrière touchée', body: 'Reverse Convertible : protection activée sur le sous-jacent LVMH.', date: '2026-04-11', read: false, tone: 'warn' },
  { id: 'n-4', title: 'Maintenance prévue', body: 'Indisponibilité planifiée le 30 avril entre 22h et 23h.', date: '2026-04-20', read: true, tone: 'navy' },
];
