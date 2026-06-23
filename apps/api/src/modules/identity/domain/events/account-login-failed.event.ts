import { IEvent } from '@nestjs/cqrs';

/** Émis sur échec d'authentification (alimente le lockout + l'audit). */
export class AccountLoginFailedEvent implements IEvent {
  constructor(
    public readonly accountId: string,
    public readonly email: string,
    public readonly ipAddress?: string,
    public readonly userAgent?: string,
  ) {}
}
