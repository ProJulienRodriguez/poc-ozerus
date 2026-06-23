import { Module } from '@nestjs/common';
import { EventsController } from './events.controller';
import { IdentityModule } from '../modules/identity/identity.module';

@Module({
  imports: [IdentityModule],
  controllers: [EventsController],
})
export class EventsModule {}
