import { Inject, NotFoundException } from '@nestjs/common';
import { CommandHandler, EventPublisher, ICommandHandler } from '@nestjs/cqrs';
import { Account } from '../../../domain/account.aggregate';
import {
  ACCOUNT_REPOSITORY,
  AccountRepositoryPort,
} from '../../../domain/ports/account.repository.port';
import { UnsuspendAccountCommand } from './unsuspend-account.command';

@CommandHandler(UnsuspendAccountCommand)
export class UnsuspendAccountHandler implements ICommandHandler<UnsuspendAccountCommand, void> {
  constructor(
    @Inject(ACCOUNT_REPOSITORY) private readonly accounts: AccountRepositoryPort,
    private readonly publisher: EventPublisher,
  ) {}

  async execute(command: UnsuspendAccountCommand): Promise<void> {
    const row = await this.accounts.findById(command.accountId);
    if (!row) throw new NotFoundException('Compte inconnu');

    // L'invariant « le compte doit être suspendu » est porté par l'agrégat.
    const account = this.publisher.mergeObjectContext(Account.fromRow(row));
    account.unsuspend(command.byAdminId);
    await this.accounts.saveAccount(account); // snapshot persisté
    account.commit(); // events publiés APRÈS le commit DB
  }
}
