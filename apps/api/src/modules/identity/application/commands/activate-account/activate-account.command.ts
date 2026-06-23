import { Command } from '@nestjs/cqrs';

/** Active un compte : vérifie le token d'activation et définit le mot de passe. */
export class ActivateAccountCommand extends Command<void> {
  constructor(
    public readonly token: string,
    public readonly password: string,
  ) {
    super();
  }
}
