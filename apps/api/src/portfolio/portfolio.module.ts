import { Module } from '@nestjs/common';
import { PortfolioController } from './portfolio.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [PortfolioController],
})
export class PortfolioModule {}
