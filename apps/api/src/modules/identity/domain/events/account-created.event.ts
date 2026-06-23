import { IEvent } from '@nestjs/cqrs';

/** Émis quand un admin crée un compte. Porte le token d'activation EN CLAIR
    (jamais stocké tel quel) pour que le handler email construise le lien. */
export class AccountCreatedEvent implements IEvent {
  constructor(
    public readonly accountId: string,
    public readonly email: string,
    public readonly name: string,
    public readonly activationToken: string,
  ) {}
}
