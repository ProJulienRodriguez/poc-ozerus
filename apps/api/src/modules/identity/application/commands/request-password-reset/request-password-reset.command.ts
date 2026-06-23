import { Command } from '@nestjs/cqrs';

/** (Admin) Déclenche une réinitialisation de mot de passe pour un compte. */
export class RequestPasswordResetCommand extends Command<void> {
  constructor(public readonly accountId: string) {
    super();
  }
}
