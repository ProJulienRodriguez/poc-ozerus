import { IEvent } from '@nestjs/cqrs';
import { Role } from '@prisma/client';

/** Émis quand un admin change le rôle d'un compte. */
export class AccountRoleChangedEvent implements IEvent {
  constructor(
    public readonly accountId: string,
    public readonly role: Role,
    public readonly byAdminId: string,
  ) {}
}
