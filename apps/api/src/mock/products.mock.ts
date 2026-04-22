export interface Product {
  isin: string;
  name: string;
  under: string;
  coupon: string;
  matur: string;
  prot: string;
  val: string;
  delta: string;
  tone: 'success' | 'danger' | 'neutral';
  issuer: string;
  currency: string;
  description: string;
}

export const PRODUCTS: Product[] = [
  {
    isin: 'FR0014001AB7', name: 'Autocall Eurostoxx Q3', under: 'SX5E',
    coupon: '8.25%', matur: '2029-06-14', prot: '50%', val: '102.34',
    delta: '+0.42%', tone: 'success', issuer: 'BNP Paribas',
    currency: 'EUR',
    description: 'Produit autocall sur indice Eurostoxx 50, coupon conditionnel trimestriel, barrière de protection à 50%.',
  },
  {
    isin: 'FR0014009CD2', name: 'Phoenix Memoire 5Y', under: 'CAC 40',
    coupon: '9.10%', matur: '2028-11-02', prot: '60%', val: '97.18',
    delta: '-1.08%', tone: 'danger', issuer: 'Société Générale',
    currency: 'EUR',
    description: 'Phoenix à mémoire sur CAC 40, coupon mémorisé si conditions non remplies, barrière 60%.',
  },
  {
    isin: 'DE000SL3BK42', name: 'Athena Note SPX', under: 'SPX',
    coupon: '7.75%', matur: '2030-03-20', prot: '55%', val: '104.07',
    delta: '+0.11%', tone: 'success', issuer: 'UBS',
    currency: 'USD',
    description: 'Athena sur S&P 500, observation annuelle, rappel anticipé possible, barrière 55%.',
  },
  {
    isin: 'FR0014002EF8', name: 'Reverse Convertible', under: 'LVMH / SAN',
    coupon: '10.50%', matur: '2027-08-30', prot: '70%', val: '99.62',
    delta: '-0.05%', tone: 'neutral', issuer: 'Crédit Agricole CIB',
    currency: 'EUR',
    description: 'Reverse convertible panier LVMH / Sanofi, coupon fixe garanti, barrière 70% worst-of.',
  },
  {
    isin: 'CH1234567AB9', name: 'Barrier Certificate', under: 'SMI',
    coupon: '6.40%', matur: '2028-01-15', prot: '65%', val: '101.55',
    delta: '+0.28%', tone: 'success', issuer: 'UBS',
    currency: 'CHF',
    description: 'Certificat à barrière sur SMI, coupon fixe, protection conditionnelle 65%.',
  },
  {
    isin: 'FR0014010XY5', name: 'Autocall Ecologie Q2', under: 'MSCI Europe ESG',
    coupon: '7.00%', matur: '2029-04-10', prot: '60%', val: '100.98',
    delta: '+0.18%', tone: 'success', issuer: 'Natixis',
    currency: 'EUR',
    description: 'Autocall thématique ESG, indice MSCI Europe ESG Leaders, coupon 7%, barrière 60%.',
  },
  {
    isin: 'DE000DB9ABC3', name: 'Range Accrual Note', under: 'Eonia / CMS',
    coupon: '5.50%', matur: '2031-09-01', prot: '100%', val: '98.04',
    delta: '-0.22%', tone: 'neutral', issuer: 'Deutsche Bank',
    currency: 'EUR',
    description: 'Range accrual sur spread CMS 10Y-2Y, protection 100% capital à maturité.',
  },
];
