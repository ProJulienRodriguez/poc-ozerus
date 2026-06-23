import { IEvent } from '@nestjs/cqrs';

/** Émis quand un compte active (ou désactive) le MFA. */
export class MfaToggledEvent implements IEvent {
  constructor(
    public readonly accountId: string,
    public readonly enabled: boolean,
  ) {}
}
