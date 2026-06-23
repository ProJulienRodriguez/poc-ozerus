import { Command } from '@nestjs/cqrs';
import { Role } from '@prisma/client';

export interface VerifyMfaChallengeResult {
  accountId: string;
  email: string;
  name: string;
  role: Role;
  newTrustedDeviceId?: string;
}

/** Valide le défi MFA (code TOTP ou code de secours) lors du login. */
export class VerifyMfaChallengeCommand extends Command<VerifyMfaChallengeResult> {
  constructor(
    public readonly accountId: string,
    public readonly totpCode: string | null,
    public readonly recoveryCode: string | null,
    public readonly rememberDevice: boolean,
    public readonly deviceLabel: string | null,
    public readonly ipAddress?: string,
    public readonly userAgent?: string,
  ) {
    super();
  }
}
