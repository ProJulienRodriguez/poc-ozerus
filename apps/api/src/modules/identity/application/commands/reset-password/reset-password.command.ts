import { Command } from '@nestjs/cqrs';

/** Définit un nouveau mot de passe via un token de réinitialisation. */
export class ResetPasswordCommand extends Command<void> {
  constructor(
    public readonly token: string,
    public readonly newPassword: string,
  ) {
    super();
  }
}
