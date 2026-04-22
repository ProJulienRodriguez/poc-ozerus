import type { ChartPayload, Kpi } from './types';

const ASC = [220, 225, 232, 238, 244, 251, 258, 266, 270, 276, 280, 285];
const BENCH = [215, 220, 226, 230, 236, 240, 248, 254, 260, 263, 268, 274];
const WAVE = [32, 34, 36, 35, 38, 39, 41, 40, 42, 41, 42, 42];

export const KPIS: Kpi[] = [
  { id: 'aum', label: 'Encours', value: '284,6', unit: 'M€', delta: '+2,4%', deltaTone: 'success', sub: 'vs. trimestre', spark: ASC, sparkColor: 'var(--oz-forest)' },
  { id: 'products', label: 'Produits actifs', value: '42', delta: '+3', deltaTone: 'success', sub: 'ce mois', spark: WAVE, sparkColor: 'var(--oz-navy)' },
  { id: 'clients', label: 'Clients actifs', value: '318', delta: '+12', deltaTone: 'success', sub: 'vs. mois' },
  { id: 'coupon', label: 'Coupon moyen', value: '8,17', unit: '%', delta: '-0,1pt', deltaTone: 'warn', sub: '30j glissants' },
];

export const CHART: ChartPayload = {
  labels: ['jan', 'fév', 'mar', 'avr', 'mai', 'juin', 'juil', 'août', 'sep', 'oct', 'nov', 'déc'],
  series: [
    { data: ASC, color: '#233056', label: 'Portefeuille' },
    { data: BENCH, color: '#6976A0', dashed: true, fill: false, label: 'Benchmark' },
  ],
};
