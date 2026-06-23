import { Inject, NotFoundException } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Invite } from '../../../domain/invite.aggregate';
import {
  INVITE_REPOSITORY,
  InviteRepositoryPort,
} from '../../../domain/ports/invite.repository.port';
import { RevokeInviteCommand } from './revoke-invite.command';

@CommandHandler(RevokeInviteCommand)
export class RevokeInviteHandler implements ICommandHandler<RevokeInviteCommand, void> {
  constructor(@Inject(INVITE_REPOSITORY) private readonly invites: InviteRepositoryPort) {}

  async execute(command: RevokeInviteCommand): Promise<void> {
    const row = await this.invites.findById(command.inviteId);
    if (!row) throw new NotFoundException('Invitation inconnue');

    const invite = Invite.fromRow(row);
    invite.ensureRevocable(); // refuse la révocation d'une invitation déjà utilisée
    await this.invites.remove(invite.id);
  }
}
