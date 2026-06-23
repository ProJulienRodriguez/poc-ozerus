import { Command } from '@nestjs/cqrs';

export interface ConfirmMfaResult {
  recoveryCodes: string[];
}

/** Confirme l'enrôlement MFA via un premier code TOTP ; active le MFA et
    retourne les codes de secours (affichés une seule fois). */
export class ConfirmMfaCommand extends Command<ConfirmMfaResult> {
  constructor(
    public readonly accountId: string,
    public readonly code: string,
  ) {
    super();
  }
}
