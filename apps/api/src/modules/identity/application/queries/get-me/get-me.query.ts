import { Query } from '@nestjs/cqrs';
import { PublicUser } from '../../../domain/auth-user';

/** Lecture du profil courant (relit la base pour refléter rôle/statut à jour). */
export class GetMeQuery extends Query<PublicUser> {
  constructor(public readonly accountId: string) {
    super();
  }
}
