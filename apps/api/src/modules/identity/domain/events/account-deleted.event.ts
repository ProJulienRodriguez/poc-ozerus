import { IEvent } from '@nestjs/cqrs';

/** Émis quand un admin supprime un compte (purge RGPD). Porte l'email car
    l'utilisateur n'existe plus au moment où l'audit est écrit. */
export class AccountDeletedEvent implements IEvent {
  constructor(
    public readonly accountId: string,
    public readonly email: string,
    public readonly byAdminId: string,
  ) {}
}
