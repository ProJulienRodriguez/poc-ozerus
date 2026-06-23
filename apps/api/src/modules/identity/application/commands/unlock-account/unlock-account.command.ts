import { Command } from '@nestjs/cqrs';

/** (Admin) Déverrouille un compte bloqué par trop de tentatives échouées. */
export class UnlockAccountCommand extends Command<void> {
  constructor(
    public readonly accountId: string,
    public readonly byAdminId: string,
  ) {
    super();
  }
}
