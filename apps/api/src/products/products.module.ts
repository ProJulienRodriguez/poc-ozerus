import { Module } from '@nestjs/common';
import { ProductsController } from './products.controller';
import { IdentityModule } from '../modules/identity/identity.module';

@Module({
  imports: [IdentityModule],
  controllers: [ProductsController],
})
export class ProductsModule {}
