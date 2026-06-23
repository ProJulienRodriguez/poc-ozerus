import { Inject, NotFoundException } from '@nestjs/common';
import { CommandHandler, EventPublisher, ICommandHandler } from '@nestjs/cqrs';
import { Account } from '../../../domain/account.aggregate';
import {
  ACCOUNT_REPOSITORY,
  AccountRepositoryPort,
} from '../../../domain/ports/account.repository.port';
import { RevokeAllSessionsCommand } from './revoke-all-sessions.command';

@CommandHandler(RevokeAllSessionsCommand)
export class RevokeAllSessionsHandler implements ICommandHandler<RevokeAllSessionsCommand, void> {
  constructor(
    @Inject(ACCOUNT_REPOSITORY) private readonly accounts: AccountRepositoryPort,
    private readonly publisher: EventPublisher,
  ) {}

  async execute(command: RevokeAllSessionsCommand): Promise<void> {
    const row = await this.accounts.findById(command.accountId);
    if (!row) throw new NotFoundException('Compte inconnu');

    const account = this.publisher.mergeObjectContext(Account.fromRow(row));
    // On décale l'épochè 1 s dans le futur : couvre les tokens émis « à la même seconde ».
    account.revokeAllSessions(new Date(Date.now() + 1000));
    await this.accounts.saveAccount(account);
    account.commit();
  }
}
