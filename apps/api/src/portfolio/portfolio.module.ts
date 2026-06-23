import { Module } from '@nestjs/common';
import { PortfolioController } from './portfolio.controller';
import { IdentityModule } from '../modules/identity/identity.module';

@Module({
  imports: [IdentityModule],
  controllers: [PortfolioController],
})
export class PortfolioModule {}
