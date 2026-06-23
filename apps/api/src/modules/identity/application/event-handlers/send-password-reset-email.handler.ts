import { Inject } from '@nestjs/common';
import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { PasswordResetRequestedEvent } from '../../domain/events/password-reset-requested.event';
import { IdentityMailerPort, MAILER } from '../../domain/ports/mailer.port';
import { frontBaseUrl } from '../identity.constants';

@EventsHandler(PasswordResetRequestedEvent)
export class SendPasswordResetEmailHandler
  implements IEventHandler<PasswordResetRequestedEvent>
{
  constructor(@Inject(MAILER) private readonly mailer: IdentityMailerPort) {}

  handle(event: PasswordResetRequestedEvent): void {
    const link = `${frontBaseUrl()}/reset-password?token=${encodeURIComponent(event.resetToken)}`;
    this.mailer.sendPasswordReset(event.email, event.name, link);
  }
}
