import { Command } from '@nestjs/cqrs';
import { Invite, Role } from '@prisma/client';

/** (Admin) Génère une invitation (lien d'inscription) pour un rôle donné. */
export class CreateInviteCommand extends Command<Invite> {
  constructor(
    public readonly createdById: string,
    public readonly email: string | undefined,
    public readonly role: Role,
  ) {
    super();
  }
}
