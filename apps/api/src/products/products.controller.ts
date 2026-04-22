import { Controller, Get, NotFoundException, Param, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { PRODUCTS, Product } from '../mock/products.mock';

@UseGuards(JwtAuthGuard)
@Controller('products')
export class ProductsController {
  @Get()
  list(@Query('q') q?: string): Product[] {
    if (!q) return PRODUCTS;
    const needle = q.toLowerCase();
    return PRODUCTS.filter(p =>
      p.isin.toLowerCase().includes(needle) ||
      p.name.toLowerCase().includes(needle) ||
      p.under.toLowerCase().includes(needle)
    );
  }

  @Get(':isin')
  get(@Param('isin') isin: string): Product {
    const product = PRODUCTS.find(p => p.isin === isin);
    if (!product) throw new NotFoundException('Produit introuvable.');
    return product;
  }
}
