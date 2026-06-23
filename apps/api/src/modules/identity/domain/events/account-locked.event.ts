import { IEvent } from '@nestjs/cqrs';

/** Émis quand un compte est verrouillé suite à trop d'échecs de connexion. */
export class AccountLockedEvent implements IEvent {
  constructor(
    public readonly accountId: string,
    public readonly lockedUntil: Date,
    public readonly failedAttempts: number,
  ) {}
}
