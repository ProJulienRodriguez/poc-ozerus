import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import {
  INVITE_REPOSITORY,
  InviteRepositoryPort,
} from '../../../domain/ports/invite.repository.port';
import { GetInviteInfoQuery, InviteInfo } from './get-invite-info.query';

@QueryHandler(GetInviteInfoQuery)
export class GetInviteInfoHandler implements IQueryHandler<GetInviteInfoQuery, InviteInfo> {
  constructor(@Inject(INVITE_REPOSITORY) private readonly invites: InviteRepositoryPort) {}

  async execute(query: GetInviteInfoQuery): Promise<InviteInfo> {
    const invite = await this.invites.findById(query.token);
    if (!invite) return { valid: false, reason: 'Invitation inconnue ou révoquée' };
    if (invite.usedAt) return { valid: false, reason: 'Invitation déjà utilisée' };
    if (invite.expiresAt < new Date()) return { valid: false, reason: 'Invitation expirée' };
    return { valid: true, email: invite.email, role: invite.role };
  }
}
