import { Command } from '@nestjs/cqrs';
import { Role } from '@prisma/client';

export interface RegisterResult {
  accountId: string;
  email: string;
  name: string;
  role: Role;
}

/** Inscription d'un invité via un token d'invitation : crée un compte ACTIVE. */
export class RegisterViaInviteCommand extends Command<RegisterResult> {
  constructor(
    public readonly token: string,
    public readonly name: string,
    public readonly email: string,
    public readonly password: string,
  ) {
    super();
  }
}
