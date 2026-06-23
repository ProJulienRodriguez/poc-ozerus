import { Command } from '@nestjs/cqrs';

/** (Admin) Suspend un compte (blocage immédiat des accès). */
export class SuspendAccountCommand extends Command<void> {
  constructor(
    public readonly accountId: string,
    public readonly byAdminId: string,
  ) {
    super();
  }
}
