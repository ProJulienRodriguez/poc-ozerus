import { Command } from '@nestjs/cqrs';

/** « Déconnexion partout » : invalide tous les tokens (access + refresh) du compte. */
export class RevokeAllSessionsCommand extends Command<void> {
  constructor(public readonly accountId: string) {
    super();
  }
}
