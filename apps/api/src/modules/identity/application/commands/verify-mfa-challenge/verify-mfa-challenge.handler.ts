import { Inject, UnauthorizedException } from '@nestjs/common';
import { CommandHandler, EventBus, ICommandHandler } from '@nestjs/cqrs';
import { AccountLoggedInEvent } from '../../../domain/events/account-logged-in.event';
import {
  ACCOUNT_REPOSITORY,
  AccountRepositoryPort,
} from '../../../domain/ports/account.repository.port';
import {
  RECOVERY_CODE_REPOSITORY,
  RecoveryCodeRepositoryPort,
} from '../../../domain/ports/recovery-code.repository.port';
import { SECRET_CIPHER, SecretCipherPort } from '../../../domain/ports/secret-cipher.port';
import {
  TRUSTED_DEVICE_REPOSITORY,
  TrustedDeviceRepositoryPort,
} from '../../../domain/ports/trusted-device.repository.port';
import { TOTP_SERVICE, TotpServicePort } from '../../../domain/ports/totp.service.port';
import { hashToken } from '../../../infrastructure/utils/hash-token.util';
import { normalizeRecoveryCode } from '../../../infrastructure/utils/recovery-codes.util';
import { TRUSTED_DEVICE_TTL_SECONDS } from '../../identity.constants';
import {
  VerifyMfaChallengeCommand,
  VerifyMfaChallengeResult,
} from './verify-mfa-challenge.command';

@CommandHandler(VerifyMfaChallengeCommand)
export class VerifyMfaChallengeHandler
  implements ICommandHandler<VerifyMfaChallengeCommand, VerifyMfaChallengeResult>
{
  constructor(
    @Inject(ACCOUNT_REPOSITORY) private readonly accounts: AccountRepositoryPort,
    @Inject(TOTP_SERVICE) private readonly totp: TotpServicePort,
    @Inject(SECRET_CIPHER) private readonly cipher: SecretCipherPort,
    @Inject(RECOVERY_CODE_REPOSITORY) private readonly recovery: RecoveryCodeRepositoryPort,
    @Inject(TRUSTED_DEVICE_REPOSITORY) private readonly devices: TrustedDeviceRepositoryPort,
    private readonly eventBus: EventBus,
  ) {}

  async execute(command: VerifyMfaChallengeCommand): Promise<VerifyMfaChallengeResult> {
    const user = await this.accounts.findById(command.accountId);
    if (!user || !user.mfaEnabled || !user.mfaSecretEnc) {
      throw new UnauthorizedException('Défi MFA invalide');
    }

    let valid = false;
    if (command.totpCode) {
      valid = this.totp.verify(command.totpCode, this.cipher.decrypt(user.mfaSecretEnc));
    } else if (command.recoveryCode) {
      valid = await this.recovery.consume(
        user.id,
        hashToken(normalizeRecoveryCode(command.recoveryCode)),
      );
    }
    if (!valid) throw new UnauthorizedException('Code MFA invalide');

    let newTrustedDeviceId: string | undefined;
    if (command.rememberDevice) {
      newTrustedDeviceId = await this.devices.add(
        user.id,
        command.deviceLabel,
        new Date(Date.now() + TRUSTED_DEVICE_TTL_SECONDS * 1000),
      );
    }

    await this.accounts.resetLoginCounters(user.id);
    this.eventBus.publish(
      new AccountLoggedInEvent(user.id, command.ipAddress, command.userAgent),
    );

    return {
      accountId: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      newTrustedDeviceId,
    };
  }
}
