import { Inject, UnauthorizedException } from '@nestjs/common';
import { CommandHandler, EventPublisher, ICommandHandler } from '@nestjs/cqrs';
import { Account } from '../../../domain/account.aggregate';
import {
  ACCOUNT_REPOSITORY,
  AccountRepositoryPort,
} from '../../../domain/ports/account.repository.port';
import { PASSWORD_HASHER, PasswordHasherPort } from '../../../domain/ports/password-hasher.port';
import { ChangePasswordCommand } from './change-password.command';

@CommandHandler(ChangePasswordCommand)
export class ChangePasswordHandler implements ICommandHandler<ChangePasswordCommand, void> {
  constructor(
    @Inject(ACCOUNT_REPOSITORY) private readonly accounts: AccountRepositoryPort,
    @Inject(PASSWORD_HASHER) private readonly hasher: PasswordHasherPort,
    private readonly publisher: EventPublisher,
  ) {}

  async execute(command: ChangePasswordCommand): Promise<void> {
    const row = await this.accounts.findById(command.accountId);
    if (!row || !row.passwordHash) throw new UnauthorizedException('Compte invalide');

    // Vérification du mot de passe actuel : concern d'authentification (hasher infra).
    const ok = await this.hasher.compare(command.currentPassword, row.passwordHash);
    if (!ok) throw new UnauthorizedException('Mot de passe actuel incorrect');

    const account = this.publisher.mergeObjectContext(Account.fromRow(row));
    account.changePassword(await this.hasher.hash(command.newPassword));
    await this.accounts.saveAccount(account); // écriture unique
    account.commit();
  }
}
