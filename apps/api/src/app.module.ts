import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { ProductsModule } from './products/products.module';
import { EventsModule } from './events/events.module';
import { ReportsModule } from './reports/reports.module';
import { PortfolioModule } from './portfolio/portfolio.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    AuthModule,
    DashboardModule,
    ProductsModule,
    EventsModule,
    ReportsModule,
    PortfolioModule,
    UsersModule,
  ],
})
export class AppModule {}
