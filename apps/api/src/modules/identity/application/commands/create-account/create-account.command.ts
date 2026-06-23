import { Command } from '@nestjs/cqrs';
import { Role } from '@prisma/client';

/** (Admin) Crée un compte PENDING_CONFIRMATION et déclenche l'email d'activation. */
export class CreateAccountCommand extends Command<{ accountId: string }> {
  constructor(
    public readonly email: string,
    public readonly name: string,
    public readonly role: Role,
  ) {
    super();
  }
}
