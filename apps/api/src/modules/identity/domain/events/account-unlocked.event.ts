import { IEvent } from '@nestjs/cqrs';

/** Émis quand un admin déverrouille manuellement un compte (lockout brute-force). */
export class AccountUnlockedEvent implements IEvent {
  constructor(
    public readonly accountId: string,
    public readonly byAdminId: string,
  ) {}
}
