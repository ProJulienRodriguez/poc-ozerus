import { BadRequestException, Inject, UnauthorizedException } from '@nestjs/common';
import { CommandHandler, EventBus, ICommandHandler } from '@nestjs/cqrs';
import { SecurityActionEvent } from '../../../domain/events/security-action.event';
import {
  ACCOUNT_REPOSITORY,
  AccountRepositoryPort,
} from '../../../domain/ports/account.repository.port';
import {
  RECOVERY_CODE_REPOSITORY,
  RecoveryCodeRepositoryPort,
} from '../../../domain/ports/recovery-code.repository.port';
import { SECRET_CIPHER, SecretCipherPort } from '../../../domain/ports/secret-cipher.port';
import { TOTP_SERVICE, TotpServicePort } from '../../../domain/ports/totp.service.port';
import { hashToken } from '../../../infrastructure/utils/hash-token.util';
import {
  generateRecoveryCodes,
  normalizeRecoveryCode,
} from '../../../infrastructure/utils/recovery-codes.util';
import { MFA_RECOVERY_CODES_COUNT } from '../../identity.constants';
import {
  RegenerateRecoveryCodesCommand,
  RegenerateRecoveryCodesResult,
} from './regenerate-recovery-codes.command';

@CommandHandler(RegenerateRecoveryCodesCommand)
export class RegenerateRecoveryCodesHandler
  implements ICommandHandler<RegenerateRecoveryCodesCommand, RegenerateRecoveryCodesResult>
{
  constructor(
    @Inject(ACCOUNT_REPOSITORY) private readonly accounts: AccountRepositoryPort,
    @Inject(TOTP_SERVICE) private readonly totp: TotpServicePort,
    @Inject(SECRET_CIPHER) private readonly cipher: SecretCipherPort,
    @Inject(RECOVERY_CODE_REPOSITORY) private readonly recovery: RecoveryCodeRepositoryPort,
    private readonly eventBus: EventBus,
  ) {}

  async execute(
    command: RegenerateRecoveryCodesCommand,
  ): Promise<RegenerateRecoveryCodesResult> {
    const user = await this.accounts.findById(command.accountId);
    if (!user || !user.mfaEnabled || !user.mfaSecretEnc) {
      throw new BadRequestException("Le MFA n'est pas activé");
    }

    // On exige une preuve de possession (TOTP) ou un code de secours encore valide.
    const secret = this.cipher.decrypt(user.mfaSecretEnc);
    const validTotp = this.totp.verify(command.code, secret);
    const validRecovery =
      !validTotp &&
      (await this.recovery.consume(user.id, hashToken(normalizeRecoveryCode(command.code))));
    if (!validTotp && !validRecovery) {
      throw new UnauthorizedException('Code invalide');
    }

    const codes = generateRecoveryCodes(MFA_RECOVERY_CODES_COUNT);
    await this.recovery.replaceForUser(
      user.id,
      codes.map((c) => hashToken(c)),
    );

    this.eventBus.publish(new SecurityActionEvent(user.id, 'RECOVERY_CODES_REGENERATED'));
    return { recoveryCodes: codes };
  }
}
