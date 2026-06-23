import { IEvent } from '@nestjs/cqrs';

/** Émis quand un invité crée son compte via un lien d'invitation. */
export class AccountRegisteredEvent implements IEvent {
  constructor(
    public readonly accountId: string,
    public readonly email: string,
    public readonly inviteId: string,
  ) {}
}
