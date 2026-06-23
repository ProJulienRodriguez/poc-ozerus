import { Controller, Get, UseGuards } from '@nestjs/common';
import { AccessTokenGuard } from '../modules/identity/presentation/guards/access-token.guard';
import { EVENTS } from '../mock/events.mock';

@UseGuards(AccessTokenGuard)
@Controller('events')
export class EventsController {
  @Get()
  list() {
    return EVENTS;
  }
}
