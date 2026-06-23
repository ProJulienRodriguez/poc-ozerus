import { Command } from '@nestjs/cqrs';

/** (Admin) Réactive un compte suspendu. */
export class UnsuspendAccountCommand extends Command<void> {
  constructor(
    public readonly accountId: string,
    public readonly byAdminId: string,
  ) {
    super();
  }
}
