import { IEvent } from '@nestjs/cqrs';

/** Émis quand un admin réactive un compte suspendu. */
export class AccountUnsuspendedEvent implements IEvent {
  constructor(
    public readonly accountId: string,
    public readonly byAdminId: string,
  ) {}
}
