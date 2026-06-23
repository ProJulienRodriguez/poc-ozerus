import { Body, Controller, Delete, Get, Param, Post, UseGuards } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { parseOrBadRequest } from '../../../../core/validation';
import { CreateInviteCommand } from '../../application/commands/create-invite/create-invite.command';
import { RevokeInviteCommand } from '../../application/commands/revoke-invite/revoke-invite.command';
import { ListInvitesQuery } from '../../application/queries/list-invites/list-invites.query';
import { AuthUser } from '../../domain/auth-user';
import { AdminGuard, CurrentUser } from '../guards/access-token.guard';
import { createInviteSchema } from '../schemas/auth.schemas';

/** Gestion des invitations par un administrateur. */
@Controller('admin/invites')
@UseGuards(AdminGuard)
export class AdminInvitesController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Post()
  async create(@CurrentUser() user: AuthUser, @Body() body: unknown) {
    const input = parseOrBadRequest(createInviteSchema, body);
    const invite = await this.commandBus.execute(
      new CreateInviteCommand(user.sub, input.email, input.role),
    );
    return { ...invite, registerPath: `/register?token=${invite.id}` };
  }

  @Get()
  list() {
    return this.queryBus.execute(new ListInvitesQuery());
  }

  @Delete(':id')
  async revoke(@Param('id') id: string) {
    await this.commandBus.execute(new RevokeInviteCommand(id));
    return { ok: true };
  }
}
