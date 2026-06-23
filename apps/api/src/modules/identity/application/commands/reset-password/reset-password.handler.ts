import { Inject } from '@nestjs/common';
import { CommandHandler, EventPublisher, ICommandHandler } from '@nestjs/cqrs';
import { TransactionManager } from '../../../../../core/prisma/transaction.manager';
import { Account } from '../../../domain/account.aggregate';
import { InvalidTokenException } from '../../../domain/exceptions/identity.exceptions';
import {
  ACCOUNT_REPOSITORY,
  AccountRepositoryPort,
} from '../../../domain/ports/account.repository.port';
import { PASSWORD_HASHER, PasswordHasherPort } from '../../../domain/ports/password-hasher.port';
import { hashToken } from '../../../infrastructure/utils/hash-token.util';
import { ResetPasswordCommand } from './reset-password.command';

@CommandHandler(ResetPasswordCommand)
export class ResetPasswordHandler implements ICommandHandler<ResetPasswordCommand, void> {
  constructor(
    @Inject(ACCOUNT_REPOSITORY) private readonly accounts: AccountRepositoryPort,
    @Inject(PASSWORD_HASHER) private readonly hasher: PasswordHasherPort,
    private readonly txm: TransactionManager,
    private readonly publisher: EventPublisher,
  ) {}

  async execute(command: ResetPasswordCommand): Promise<void> {
    const submittedHash = hashToken(command.token);
    const row = await this.accounts.findByResetTokenHash(submittedHash);
    if (!row) throw new InvalidTokenException('Lien de réinitialisation invalide ou expiré');

    const passwordHash = await this.hasher.hash(command.newPassword);
    const account = this.publisher.mergeObjectContext(Account.fromRow(row));
    account.resetPassword(submittedHash, passwordHash, new Date());

    // Atomique : nouveau mot de passe (+ token effacé) ET levée d'un éventuel verrou.
    await this.txm.run(async (tx) => {
      await this.accounts.saveAccount(account, tx);
      await this.accounts.resetLoginCounters(account.id, tx);
    });

    account.commit();
  }
}
