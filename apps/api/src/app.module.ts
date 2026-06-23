import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { PrismaModule } from './core/prisma/prisma.module';
import { MailModule } from './core/mail/mail.module';
import { SeedModule } from './seed/seed.module';
import { IdentityModule } from './modules/identity/identity.module';
import { CommunicationModule } from './modules/communication/communication.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { ProductsModule } from './products/products.module';
import { EventsModule } from './events/events.module';
import { ReportsModule } from './reports/reports.module';
import { PortfolioModule } from './portfolio/portfolio.module';

@Module({
  imports: [
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 300 }]),
    ScheduleModule.forRoot(),
    // Socle transverse (modules @Global).
    PrismaModule,
    MailModule,
    SeedModule,
    // Modules d'authentification et de communication.
    IdentityModule,
    CommunicationModule,
    // Modules métier existants.
    DashboardModule,
    ProductsModule,
    EventsModule,
    ReportsModule,
    PortfolioModule,
  ],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
