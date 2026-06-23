import { Command } from '@nestjs/cqrs';

export interface RegenerateRecoveryCodesResult {
  recoveryCodes: string[];
}

/** Régénère les codes de secours MFA (invalide les précédents). Exige un code valide. */
export class RegenerateRecoveryCodesCommand extends Command<RegenerateRecoveryCodesResult> {
  constructor(
    public readonly accountId: string,
    public readonly code: string,
  ) {
    super();
  }
}
