import { IEvent } from '@nestjs/cqrs';

/** Émis quand un compte est activé (mot de passe défini → ACTIVE). */
export class AccountActivatedEvent implements IEvent {
  constructor(public readonly accountId: string) {}
}
