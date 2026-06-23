import { Inject, NotFoundException } from '@nestjs/common';
import { CommandHandler, EventPublisher, ICommandHandler } from '@nestjs/cqrs';
import { Account } from '../../../domain/account.aggregate';
import {
  ACCOUNT_REPOSITORY,
  AccountRepositoryPort,
} from '../../../domain/ports/account.repository.port';
import { generateOpaqueToken, hashToken } from '../../../infrastructure/utils/hash-token.util';
import { PASSWORD_RESET_TTL_MS } from '../../identity.constants';
import { RequestPasswordResetCommand } from './request-password-reset.command';

@CommandHandler(RequestPasswordResetCommand)
export class RequestPasswordResetHandler
  implements ICommandHandler<RequestPasswordResetCommand, void>
{
  constructor(
    @Inject(ACCOUNT_REPOSITORY) private readonly accounts: AccountRepositoryPort,
    private readonly publisher: EventPublisher,
  ) {}

  async execute(command: RequestPasswordResetCommand): Promise<void> {
    const row = await this.accounts.findById(command.accountId);
    if (!row) throw new NotFoundException('Compte inconnu');

    const plain = generateOpaqueToken();
    const account = this.publisher.mergeObjectContext(Account.fromRow(row));
    // Un seul slot de reset = un seul lien valide à la fois (écrase le précédent).
    account.requestPasswordReset(
      hashToken(plain),
      new Date(Date.now() + PASSWORD_RESET_TTL_MS),
      plain,
    );

    await this.accounts.saveAccount(account); // écriture unique
    account.commit(); // PasswordResetRequestedEvent (token en clair) publié après commit
  }
}
