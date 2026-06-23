import { Inject } from '@nestjs/common';
import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { AccountCreatedEvent } from '../../domain/events/account-created.event';
import { IdentityMailerPort, MAILER } from '../../domain/ports/mailer.port';
import { frontBaseUrl } from '../identity.constants';

@EventsHandler(AccountCreatedEvent)
export class SendActivationEmailHandler implements IEventHandler<AccountCreatedEvent> {
  constructor(@Inject(MAILER) private readonly mailer: IdentityMailerPort) {}

  handle(event: AccountCreatedEvent): void {
    const link = `${frontBaseUrl()}/activate?token=${encodeURIComponent(event.activationToken)}`;
    this.mailer.sendActivation(event.email, event.name, link);
  }
}
