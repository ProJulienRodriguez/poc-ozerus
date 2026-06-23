import { Controller, Get, Param } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { GetInviteInfoQuery, InviteInfo } from '../../application/queries/get-invite-info/get-invite-info.query';

/** Endpoint public : la page /register vérifie la validité du lien d'invitation. */
@Controller('invites')
export class InvitesController {
  constructor(private readonly queryBus: QueryBus) {}

  @Get(':id')
  info(@Param('id') id: string): Promise<InviteInfo> {
    return this.queryBus.execute(new GetInviteInfoQuery(id));
  }
}
