import { Command } from '@nestjs/cqrs';

/** Change le mot de passe d'un compte authentifié (vérifie l'ancien). */
export class ChangePasswordCommand extends Command<void> {
  constructor(
    public readonly accountId: string,
    public readonly currentPassword: string,
    public readonly newPassword: string,
  ) {
    super();
  }
}
