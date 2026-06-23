import { IEvent } from '@nestjs/cqrs';

/** Émis quand un admin suspend un compte. */
export class AccountSuspendedEvent implements IEvent {
  constructor(
    public readonly accountId: string,
    public readonly byAdminId: string,
  ) {}
}
