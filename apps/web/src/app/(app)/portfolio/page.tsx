import { PORTFOLIO } from '@/mocks/portfolio';
import { PortfolioView } from './portfolio-view';

export default function PortfolioPage() {
  return <PortfolioView summary={PORTFOLIO} />;
}
