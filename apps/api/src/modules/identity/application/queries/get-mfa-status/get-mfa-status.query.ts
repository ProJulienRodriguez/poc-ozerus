import { Query } from '@nestjs/cqrs';

/** Statut MFA du compte courant (pour l'écran de sécurité du profil). */
export class GetMfaStatusQuery extends Query<{ enabled: boolean }> {
  constructor(public readonly accountId: string) {
    super();
  }
}
