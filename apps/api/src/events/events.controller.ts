import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { EVENTS } from '../mock/events.mock';

@UseGuards(JwtAuthGuard)
@Controller('events')
export class EventsController {
  @Get()
  list() {
    return EVENTS;
  }
}
