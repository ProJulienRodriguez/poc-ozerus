import { Inject, NotFoundException } from '@nestjs/common';
import { CommandHandler, EventPublisher, ICommandHandler } from '@nestjs/cqrs';
import { Account } from '../../../domain/account.aggregate';
import {
  ACCOUNT_REPOSITORY,
  AccountRepositoryPort,
} from '../../../domain/ports/account.repository.port';
import { SuspendAccountCommand } from './suspend-account.command';

@CommandHandler(SuspendAccountCommand)
export class SuspendAccountHandler implements ICommandHandler<SuspendAccountCommand, void> {
  constructor(
    @Inject(ACCOUNT_REPOSITORY) private readonly accounts: AccountRepositoryPort,
    private readonly publisher: EventPublisher,
  ) {}

  async execute(command: SuspendAccountCommand): Promise<void> {
    const row = await this.accounts.findById(command.accountId);
    if (!row) throw new NotFoundException('Compte inconnu');

    const account = this.publisher.mergeObjectContext(Account.fromRow(row));
    account.suspend(command.byAdminId);
    await this.accounts.saveAccount(account); // snapshot persisté
    account.commit(); // events publiés APRÈS le commit DB
  }
}
