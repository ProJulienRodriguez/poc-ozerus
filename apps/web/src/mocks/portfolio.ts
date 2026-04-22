import type { PortfolioSummary } from './types';

export const PORTFOLIO: PortfolioSummary = {
  totalAum: 284600000,
  clients: 318,
  avgCoupon: 8.17,
  positions: [
    { client: 'Jean Dupont', aum: 1_450_000, products: 6 },
    { client: 'Sophie Martin', aum: 890_000, products: 3 },
    { client: 'Luc Petit', aum: 3_200_000, products: 9 },
    { client: 'Emma Roux', aum: 420_000, products: 2 },
    { client: 'Paul Garcia', aum: 1_780_000, products: 5 },
  ],
};
