import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import {
  INVITE_REPOSITORY,
  InviteRepositoryPort,
} from '../../../domain/ports/invite.repository.port';
import { AdminInviteView, ListInvitesQuery } from './list-invites.query';

@QueryHandler(ListInvitesQuery)
export class ListInvitesHandler implements IQueryHandler<ListInvitesQuery, AdminInviteView[]> {
  constructor(@Inject(INVITE_REPOSITORY) private readonly invites: InviteRepositoryPort) {}

  async execute(): Promise<AdminInviteView[]> {
    const invites = await this.invites.list();
    const now = new Date();
    return invites.map((i) => ({
      id: i.id,
      email: i.email,
      role: i.role,
      createdAt: i.createdAt,
      expiresAt: i.expiresAt,
      createdBy: i.createdByName,
      status: i.usedAt ? 'used' : i.expiresAt < now ? 'expired' : 'active',
      registerPath: `/register?token=${i.id}`,
    }));
  }
}
