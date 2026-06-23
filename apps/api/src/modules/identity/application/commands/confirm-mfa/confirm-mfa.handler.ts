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
import { TOTP_SERVICE, TotpServicePort } from '../../../domain/ports/totp.service.port';
import { hashToken } from '../../../infrastructure/utils/hash-token.util';
import { generateRecoveryCodes } from '../../../infrastructure/utils/recovery-codes.util';
import { MFA_RECOVERY_CODES_COUNT } from '../../identity.constants';
import { ConfirmMfaCommand, ConfirmMfaResult } from './confirm-mfa.command';

@CommandHandler(ConfirmMfaCommand)
export class ConfirmMfaHandler implements ICommandHandler<ConfirmMfaCommand, ConfirmMfaResult> {
  constructor(
    @Inject(ACCOUNT_REPOSITORY) private readonly accounts: AccountRepositoryPort,
    @Inject(TOTP_SERVICE) private readonly totp: TotpServicePort,
    @Inject(SECRET_CIPHER) private readonly cipher: SecretCipherPort,
    @Inject(RECOVERY_CODE_REPOSITORY) private readonly recovery: RecoveryCodeRepositoryPort,
    private readonly publisher: EventPublisher,
  ) {}

  async execute(command: ConfirmMfaCommand): Promise<ConfirmMfaResult> {
    const row = await this.accounts.findById(command.accountId);
    if (!row || !row.mfaSecretEnc) {
      throw new BadRequestException('Aucun enrôlement MFA en cours');
    }

    // Vérification TOTP = infra (déchiffrement + service TOTP).
    const secret = this.cipher.decrypt(row.mfaSecretEnc);
    if (!this.totp.verify(command.code, secret)) {
      throw new UnauthorizedException('Code de vérification invalide');
    }

    // Ordre sûr : on écrit les codes de secours AVANT d'activer le MFA
    // (jamais de MFA actif sans codes de récupération).
    const codes = generateRecoveryCodes(MFA_RECOVERY_CODES_COUNT);
    await this.recovery.replaceForUser(row.id, codes.map(hashToken));

    const account = this.publisher.mergeObjectContext(Account.fromRow(row));
    account.confirmMfa();
    await this.accounts.saveAccount(account);
    account.commit(); // MfaToggledEvent(true) publié après commit

    return { recoveryCodes: codes };
  }
}
