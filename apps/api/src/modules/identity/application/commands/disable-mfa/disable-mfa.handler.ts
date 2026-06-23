import { BadRequestException, Inject, UnauthorizedException } from '@nestjs/common';
import { CommandHandler, EventPublisher, ICommandHandler } from '@nestjs/cqrs';
import { Account } from '../../../domain/account.aggregate';
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
import { DisableMfaCommand } from './disable-mfa.command';

@CommandHandler(DisableMfaCommand)
export class DisableMfaHandler implements ICommandHandler<DisableMfaCommand, void> {
  constructor(
    @Inject(ACCOUNT_REPOSITORY) private readonly accounts: AccountRepositoryPort,
    @Inject(TOTP_SERVICE) private readonly totp: TotpServicePort,
    @Inject(SECRET_CIPHER) private readonly cipher: SecretCipherPort,
    @Inject(RECOVERY_CODE_REPOSITORY) private readonly recovery: RecoveryCodeRepositoryPort,
    @Inject(TRUSTED_DEVICE_REPOSITORY) private readonly devices: TrustedDeviceRepositoryPort,
    private readonly publisher: EventPublisher,
  ) {}

  async execute(command: DisableMfaCommand): Promise<void> {
    const row = await this.accounts.findById(command.accountId);
    if (!row || !row.mfaEnabled || !row.mfaSecretEnc) {
      throw new BadRequestException("Le MFA n'est pas activé");
    }

    // Vérification TOTP ou code de secours = infra.
    const secret = this.cipher.decrypt(row.mfaSecretEnc);
    const validTotp = this.totp.verify(command.code, secret);
    const validRecovery =
      !validTotp &&
      (await this.recovery.consume(row.id, hashToken(normalizeRecoveryCode(command.code))));
    if (!validTotp && !validRecovery) {
      throw new UnauthorizedException('Code invalide');
    }

    // Ordre sûr : on coupe le MFA d'abord, puis on purge codes et appareils
    // (codes/appareils résiduels sont inoffensifs une fois le MFA désactivé).
    const account = this.publisher.mergeObjectContext(Account.fromRow(row));
    account.disableMfa();
    await this.accounts.saveAccount(account);
    await this.recovery.removeAllForUser(row.id);
    await this.devices.removeAllForUser(row.id);
    account.commit(); // MfaToggledEvent(false) publié après commit
  }
}
