import { Inject } from '@nestjs/common';
import { CommandHandler, EventPublisher, ICommandHandler } from '@nestjs/cqrs';
import { Account } from '../../../domain/account.aggregate';
import { InvalidTokenException } from '../../../domain/exceptions/identity.exceptions';
import {
  ACCOUNT_REPOSITORY,
  AccountRepositoryPort,
} from '../../../domain/ports/account.repository.port';
import { PASSWORD_HASHER, PasswordHasherPort } from '../../../domain/ports/password-hasher.port';
import { hashToken } from '../../../infrastructure/utils/hash-token.util';
import { ActivateAccountCommand } from './activate-account.command';

@CommandHandler(ActivateAccountCommand)
export class ActivateAccountHandler implements ICommandHandler<ActivateAccountCommand, void> {
  constructor(
    @Inject(ACCOUNT_REPOSITORY) private readonly accounts: AccountRepositoryPort,
    @Inject(PASSWORD_HASHER) private readonly hasher: PasswordHasherPort,
    private readonly publisher: EventPublisher,
  ) {}

  async execute(command: ActivateAccountCommand): Promise<void> {
    const submittedHash = hashToken(command.token);
    const row = await this.accounts.findByConfirmationTokenHash(submittedHash);
    if (!row) throw new InvalidTokenException("Lien d'activation invalide ou expiré");

    const passwordHash = await this.hasher.hash(command.password);
    const account = this.publisher.mergeObjectContext(Account.fromRow(row));
    // L'agrégat re-vérifie l'invariant (token présent, non expiré) avant d'activer.
    account.activate(submittedHash, passwordHash, new Date());

    await this.accounts.saveAccount(account); // écriture unique (token effacé + ACTIVE)
    account.commit();
  }
}
