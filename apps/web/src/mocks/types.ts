export interface AuthUser {
  id: string;
  email: string;
  name: string;
  org: string;
  role: 'partner' | 'admin';
}

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

export interface EventItem {
  id: string;
  date: { m: string; d: string };
  kind: string;
  product: string;
  amount: string;
  tone: 'forest' | 'navy' | 'ochre' | 'warn' | 'danger' | 'success';
}

export interface Kpi {
  id: string;
  label: string;
  value: string;
  unit?: string;
  delta?: string;
  deltaTone?: string;
  sub?: string;
  spark?: number[];
  sparkColor?: string;
}

export interface ChartPayload {
  labels: string[];
  series: { data: number[]; color: string; dashed?: boolean; fill?: boolean; label: string }[];
}

export interface PortfolioPosition { client: string; aum: number; products: number }
export interface PortfolioSummary {
  totalAum: number;
  clients: number;
  avgCoupon: number;
  positions: PortfolioPosition[];
}

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

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'partner' | 'admin';
  org: string;
  lastSeen: string;
}

export interface Notification {
  id: string;
  title: string;
  body: string;
  date: string;
  read: boolean;
  tone: 'forest' | 'ochre' | 'navy' | 'warn' | 'danger';
}
