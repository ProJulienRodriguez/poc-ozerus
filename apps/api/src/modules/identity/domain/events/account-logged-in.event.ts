import { IEvent } from '@nestjs/cqrs';

/** Émis après une authentification réussie (audit, métriques). */
export class AccountLoggedInEvent implements IEvent {
  constructor(
    public readonly accountId: string,
    public readonly ipAddress?: string,
    public readonly userAgent?: string,
  ) {}
}
