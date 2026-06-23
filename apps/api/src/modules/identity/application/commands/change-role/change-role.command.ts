import { Command } from '@nestjs/cqrs';
import { Role } from '@prisma/client';

/** (Admin) Change le rôle d'un compte (LEARNER / TRAINER / ADMIN). */
export class ChangeRoleCommand extends Command<void> {
  constructor(
    public readonly accountId: string,
    public readonly role: Role,
    public readonly byAdminId: string,
  ) {
    super();
  }
}
