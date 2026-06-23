import { Command } from '@nestjs/cqrs';

/** Désactive le MFA (vérifie un code TOTP ou de secours). */
export class DisableMfaCommand extends Command<void> {
  constructor(
    public readonly accountId: string,
    public readonly code: string,
  ) {
    super();
  }
}
