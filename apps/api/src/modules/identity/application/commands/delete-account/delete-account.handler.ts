import { Inject, NotFoundException } from '@nestjs/common';
import { CommandHandler, EventPublisher, ICommandHandler } from '@nestjs/cqrs';
import { TransactionManager } from '../../../../../core/prisma/transaction.manager';
import { Account } from '../../../domain/account.aggregate';
import {
  ACCOUNT_REPOSITORY,
  AccountRepositoryPort,
} from '../../../domain/ports/account.repository.port';
import {
  INVITE_REPOSITORY,
  InviteRepositoryPort,
} from '../../../domain/ports/invite.repository.port';
import { DeleteAccountCommand } from './delete-account.command';

@CommandHandler(DeleteAccountCommand)
export class DeleteAccountHandler implements ICommandHandler<DeleteAccountCommand, void> {
  constructor(
    @Inject(ACCOUNT_REPOSITORY) private readonly accounts: AccountRepositoryPort,
    @Inject(INVITE_REPOSITORY) private readonly invites: InviteRepositoryPort,
    private readonly txm: TransactionManager,
    private readonly publisher: EventPublisher,
  ) {}

  async execute(command: DeleteAccountCommand): Promise<void> {
    const row = await this.accounts.findById(command.accountId);
    if (!row) throw new NotFoundException('Compte inconnu');

    const account = this.publisher.mergeObjectContext(Account.fromRow(row));
    account.markDeleted(command.byAdminId);

    // Atomique : purge du compte (cascades Prisma) ET des invitations rattachées à
    // l'email (non liées par FK, donc hors cascade) — effacement RGPD cohérent.
    await this.txm.run(async (tx) => {
      await this.accounts.delete(account.id, tx);
      await this.invites.deleteByEmail(row.email, tx);
    });

    // Émis APRÈS suppression : l'audit ne référence plus l'utilisateur (userId nul).
    account.commit();
  }
}
