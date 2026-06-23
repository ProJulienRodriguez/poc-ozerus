import { Command } from '@nestjs/cqrs';
import { Role } from '@prisma/client';

export interface LoginResult {
  accountId: string;
  email: string;
  name: string;
  role: Role;
  requiresMfa: boolean;
}

/** Authentifie un couple email/mot de passe. Ne délivre pas les tokens
    (c'est la couche présentation qui pose les cookies). */
export class LoginCommand extends Command<LoginResult> {
  constructor(
    public readonly email: string,
    public readonly password: string,
    public readonly ipAddress?: string,
    public readonly userAgent?: string,
    /** Id de l'appareil de confiance (cookie déchiffré) — saute le MFA si valide. */
    public readonly trustedDeviceId?: string,
  ) {
    super();
  }
}
