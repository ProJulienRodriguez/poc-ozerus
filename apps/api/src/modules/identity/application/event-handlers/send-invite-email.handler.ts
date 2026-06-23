import { Inject } from '@nestjs/common';
import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { InviteCreatedEvent } from '../../domain/events/invite-created.event';
import { IdentityMailerPort, MAILER } from '../../domain/ports/mailer.port';
import { frontBaseUrl } from '../identity.constants';

@EventsHandler(InviteCreatedEvent)
export class SendInviteEmailHandler implements IEventHandler<InviteCreatedEvent> {
  constructor(@Inject(MAILER) private readonly mailer: IdentityMailerPort) {}

  handle(event: InviteCreatedEvent): void {
    const link = `${frontBaseUrl()}/register?token=${encodeURIComponent(event.inviteId)}`;
    this.mailer.sendInvite(event.email, event.role, link);
  }
}
