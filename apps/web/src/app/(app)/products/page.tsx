import { PRODUCTS } from '@/mocks/products';
import { ProductsView } from './products-view';

export default function ProductsPage() {
  return <ProductsView products={PRODUCTS} />;
}
