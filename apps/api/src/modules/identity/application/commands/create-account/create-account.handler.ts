import { BadRequestException, Inject } from '@nestjs/common';
import { CommandHandler, EventPublisher, ICommandHandler } from '@nestjs/cqrs';
import { Account } from '../../../domain/account.aggregate';
import {
  ACCOUNT_REPOSITORY,
  AccountRepositoryPort,
} from '../../../domain/ports/account.repository.port';
import { generateOpaqueToken, hashToken } from '../../../infrastructure/utils/hash-token.util';
import { ACTIVATION_TTL_MS } from '../../identity.constants';
import { CreateAccountCommand } from './create-account.command';

@CommandHandler(CreateAccountCommand)
export class CreateAccountHandler implements ICommandHandler<CreateAccountCommand, { accountId: string }> {
  constructor(
    @Inject(ACCOUNT_REPOSITORY) private readonly accounts: AccountRepositoryPort,
    private readonly publisher: EventPublisher,
  ) {}

  async execute(command: CreateAccountCommand): Promise<{ accountId: string }> {
    const existing = await this.accounts.findByEmail(command.email);
    if (existing) throw new BadRequestException('Un compte existe déjà avec cet email');

    const plain = generateOpaqueToken();
    const account = this.publisher.mergeObjectContext(
      Account.createPending({
        email: command.email,
        name: command.name,
        role: command.role,
        confirmationTokenHash: hashToken(plain),
        confirmationTokenExpiresAt: new Date(Date.now() + ACTIVATION_TTL_MS),
        plainToken: plain,
      }),
    );

    await this.accounts.insertAccount(account); // insertion unique (token porté par le compte)
    account.commit(); // AccountCreatedEvent (porte le token en clair) publié après commit

    return { accountId: account.id };
  }
}
