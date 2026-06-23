import { IEvent } from '@nestjs/cqrs';

/** Émis après un reset ou un changement de mot de passe. */
export class PasswordChangedEvent implements IEvent {
  constructor(
    public readonly accountId: string,
    public readonly via: 'reset' | 'change',
  ) {}
}
