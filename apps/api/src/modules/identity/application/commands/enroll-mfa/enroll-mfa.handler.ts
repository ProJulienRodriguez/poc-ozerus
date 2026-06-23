import { Inject, NotFoundException } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Account } from '../../../domain/account.aggregate';
import {
  ACCOUNT_REPOSITORY,
  AccountRepositoryPort,
} from '../../../domain/ports/account.repository.port';
import { SECRET_CIPHER, SecretCipherPort } from '../../../domain/ports/secret-cipher.port';
import { TOTP_SERVICE, TotpServicePort } from '../../../domain/ports/totp.service.port';
import { EnrollMfaCommand, EnrollMfaResult } from './enroll-mfa.command';

@CommandHandler(EnrollMfaCommand)
export class EnrollMfaHandler implements ICommandHandler<EnrollMfaCommand, EnrollMfaResult> {
  constructor(
    @Inject(ACCOUNT_REPOSITORY) private readonly accounts: AccountRepositoryPort,
    @Inject(TOTP_SERVICE) private readonly totp: TotpServicePort,
    @Inject(SECRET_CIPHER) private readonly cipher: SecretCipherPort,
  ) {}

  async execute(command: EnrollMfaCommand): Promise<EnrollMfaResult> {
    const row = await this.accounts.findById(command.accountId);
    if (!row) throw new NotFoundException('Compte inconnu');

    const secret = this.totp.generateSecret();
    // Chiffrement = infra ; l'agrégat ne stocke que le secret chiffré (MFA inactif).
    const account = Account.fromRow(row);
    account.enrollMfa(this.cipher.encrypt(secret));
    await this.accounts.saveAccount(account);

    return { otpauthUri: this.totp.keyUri(row.email, secret), secret };
  }
}
