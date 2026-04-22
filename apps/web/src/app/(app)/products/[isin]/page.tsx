import { notFound } from 'next/navigation';
import { PRODUCTS } from '@/mocks/products';
import { ProductDetailView } from './product-detail-view';

export default function ProductDetailPage({ params }: { params: { isin: string } }) {
  const product = PRODUCTS.find(p => p.isin === params.isin);
  if (!product) notFound();
  return <ProductDetailView product={product} />;
}
