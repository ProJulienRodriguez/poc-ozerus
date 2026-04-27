import { KPIS, CHART } from '@/mocks/dashboard';
import { EVENTS } from '@/mocks/events';
import { PRODUCTS } from '@/mocks/products';
import { DashboardView } from './dashboard-view';

export default function DashboardPage() {
  return (
    <DashboardView
      kpis={KPIS}
      chart={CHART}
      events={EVENTS}
      products={PRODUCTS.slice(0, 7)}
    />
  );
}
