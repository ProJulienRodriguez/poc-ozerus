import { Command } from '@nestjs/cqrs';

/** (Admin) Supprime un compte (purge RGPD des données liées). */
export class DeleteAccountCommand extends Command<void> {
  constructor(
    public readonly accountId: string,
    public readonly byAdminId: string,
  ) {
    super();
  }
}
