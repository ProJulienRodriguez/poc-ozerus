import { IEvent } from '@nestjs/cqrs';

/** Émis quand un admin déclenche une réinitialisation. Token en clair pour le lien. */
export class PasswordResetRequestedEvent implements IEvent {
  constructor(
    public readonly accountId: string,
    public readonly email: string,
    public readonly name: string,
    public readonly resetToken: string,
  ) {}
}
