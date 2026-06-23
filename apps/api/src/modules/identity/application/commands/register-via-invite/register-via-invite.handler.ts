import { BadRequestException, Inject } from '@nestjs/common';
import { CommandHandler, EventPublisher, ICommandHandler } from '@nestjs/cqrs';
import { TransactionManager } from '../../../../../core/prisma/transaction.manager';
import { Account } from '../../../domain/account.aggregate';
import { Invite } from '../../../domain/invite.aggregate';
import {
  ACCOUNT_REPOSITORY,
  AccountRepositoryPort,
} from '../../../domain/ports/account.repository.port';
import {
  INVITE_REPOSITORY,
  InviteRepositoryPort,
} from '../../../domain/ports/invite.repository.port';
import { PASSWORD_HASHER, PasswordHasherPort } from '../../../domain/ports/password-hasher.port';
import { RegisterResult, RegisterViaInviteCommand } from './register-via-invite.command';

@CommandHandler(RegisterViaInviteCommand)
export class RegisterViaInviteHandler
  implements ICommandHandler<RegisterViaInviteCommand, RegisterResult>
{
  constructor(
    @Inject(INVITE_REPOSITORY) private readonly invites: InviteRepositoryPort,
    @Inject(ACCOUNT_REPOSITORY) private readonly accounts: AccountRepositoryPort,
    @Inject(PASSWORD_HASHER) private readonly hasher: PasswordHasherPort,
    private readonly txm: TransactionManager,
    private readonly publisher: EventPublisher,
  ) {}

  async execute(command: RegisterViaInviteCommand): Promise<RegisterResult> {
    const inviteRow = await this.invites.findById(command.token);
    if (!inviteRow) throw new BadRequestException('Invitation invalide');

    const existing = await this.accounts.findByEmail(command.email);
    if (existing) throw new BadRequestException('Un compte existe déjà avec cet email');

    // L'agrégat Invite porte les invariants (non utilisée, non expirée, email correspond).
    const invite = Invite.fromRow(inviteRow);
    invite.use(command.email, new Date());

    const account = this.publisher.mergeObjectContext(
      Account.register({
        email: command.email,
        name: command.name,
        role: inviteRow.role,
        passwordHash: await this.hasher.hash(command.password),
        inviteId: invite.id,
        now: new Date(),
      }),
    );

    // Atomique : création du compte ACTIVE + consommation de l'invitation.
    await this.txm.run(async (tx) => {
      await this.accounts.insertAccount(account, tx);
      await this.invites.saveInvite(invite, tx);
    });

    account.commit();

    return {
      accountId: account.id,
      email: command.email,
      name: command.name,
      role: inviteRow.role,
    };
  }
}
