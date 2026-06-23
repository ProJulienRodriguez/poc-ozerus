import { Inject } from '@nestjs/common';
import { CommandHandler, EventPublisher, ICommandHandler } from '@nestjs/cqrs';
import { Invite as InviteRow } from '@prisma/client';
import { Invite } from '../../../domain/invite.aggregate';
import {
  INVITE_REPOSITORY,
  InviteRepositoryPort,
} from '../../../domain/ports/invite.repository.port';
import { INVITE_TTL_MS } from '../../identity.constants';
import { CreateInviteCommand } from './create-invite.command';

@CommandHandler(CreateInviteCommand)
export class CreateInviteHandler implements ICommandHandler<CreateInviteCommand, InviteRow> {
  constructor(
    @Inject(INVITE_REPOSITORY) private readonly invites: InviteRepositoryPort,
    private readonly publisher: EventPublisher,
  ) {}

  async execute(command: CreateInviteCommand): Promise<InviteRow> {
    const invite = this.publisher.mergeObjectContext(
      Invite.create({
        createdById: command.createdById,
        email: command.email ?? null,
        role: command.role,
        expiresAt: new Date(Date.now() + INVITE_TTL_MS),
        now: new Date(),
      }),
    );

    await this.invites.insertInvite(invite);
    invite.commit(); // InviteCreatedEvent (si nominative) publié après commit

    return { id: invite.id, ...invite.snapshot() };
  }
}
