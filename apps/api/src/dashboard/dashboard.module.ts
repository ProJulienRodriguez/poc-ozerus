import { Module } from '@nestjs/common';
import { DashboardController } from './dashboard.controller';
import { IdentityModule } from '../modules/identity/identity.module';

@Module({
  imports: [IdentityModule],
  controllers: [DashboardController],
})
export class DashboardModule {}
