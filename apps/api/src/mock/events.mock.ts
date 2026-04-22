export interface EventItem {
  id: string;
  date: { m: string; d: string };
  kind: string;
  product: string;
  amount: string;
  tone: 'forest' | 'navy' | 'ochre' | 'warn' | 'danger' | 'success';
}

export const EVENTS: EventItem[] = [
  { id: 'e-1', date: { m: 'AVR', d: '23' }, kind: 'Coupon', product: 'Autocall Eurostoxx Q3', amount: '+2 412 €', tone: 'forest' },
  { id: 'e-2', date: { m: 'AVR', d: '18' }, kind: 'Remboursement', product: 'Phoenix Memoire 5Y', amount: '+14 800 €', tone: 'navy' },
  { id: 'e-3', date: { m: 'AVR', d: '15' }, kind: 'Souscription', product: 'Athena Note SPX', amount: '50 000 €', tone: 'ochre' },
  { id: 'e-4', date: { m: 'AVR', d: '11' }, kind: 'Barrière touchée', product: 'Reverse Convertible', amount: 'Protection activée', tone: 'warn' },
  { id: 'e-5', date: { m: 'MAR', d: '29' }, kind: 'Défaut', product: 'ABS Emerging 2027', amount: 'Perte partielle', tone: 'danger' },
  { id: 'e-6', date: { m: 'MAR', d: '22' }, kind: 'Information', product: 'Barrier Certificate', amount: 'Commentaire émetteur', tone: 'success' },
];
