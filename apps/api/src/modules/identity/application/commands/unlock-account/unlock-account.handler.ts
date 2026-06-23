import { Inject, NotFoundException } from '@nestjs/common';
import { CommandHandler, EventBus, ICommandHandler } from '@nestjs/cqrs';
import { AccountUnlockedEvent } from '../../../domain/events/account-unlocked.event';
import {
  ACCOUNT_REPOSITORY,
  AccountRepositoryPort,
} from '../../../domain/ports/account.repository.port';
import { UnlockAccountCommand } from './unlock-account.command';

/** Le lockout (failedLoginAttempts / lockedUntil) est une opération atomique de
    persistance (hors agrégat) : on réinitialise les compteurs directement. */
@CommandHandler(UnlockAccountCommand)
export class UnlockAccountHandler implements ICommandHandler<UnlockAccountCommand, void> {
  constructor(
    @Inject(ACCOUNT_REPOSITORY) private readonly accounts: AccountRepositoryPort,
    private readonly eventBus: EventBus,
  ) {}

  async execute(command: UnlockAccountCommand): Promise<void> {
    const row = await this.accounts.findById(command.accountId);
    if (!row) throw new NotFoundException('Compte inconnu');

    await this.accounts.resetLoginCounters(command.accountId);
    this.eventBus.publish(new AccountUnlockedEvent(command.accountId, command.byAdminId));
  }
}
