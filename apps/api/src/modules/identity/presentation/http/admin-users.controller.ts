import { BadRequestException, Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { z } from 'zod';
import { parseOrBadRequest } from '../../../../core/validation';
import { ChangeRoleCommand } from '../../application/commands/change-role/change-role.command';
import { DeleteAccountCommand } from '../../application/commands/delete-account/delete-account.command';
import { SuspendAccountCommand } from '../../application/commands/suspend-account/suspend-account.command';
import { UnlockAccountCommand } from '../../application/commands/unlock-account/unlock-account.command';
import { UnsuspendAccountCommand } from '../../application/commands/unsuspend-account/unsuspend-account.command';
import { GetAccountActivityQuery } from '../../application/queries/get-account-activity/get-account-activity.query';
import { ListAccountsQuery } from '../../application/queries/list-accounts/list-accounts.query';
import { AuthUser } from '../../domain/auth-user';
import { AdminGuard, CurrentUser } from '../guards/access-token.guard';

const updateUserSchema = z
  .object({
    role: z.enum(['LEARNER', 'TRAINER', 'ADMIN']).optional(),
    status: z.enum(['ACTIVE', 'SUSPENDED']).optional(),
  })
  .refine((v) => v.role || v.status, { message: 'role ou status requis' });

/** Gestion des comptes par un admin — délègue au module identity (CQS). */
@Controller('admin/users')
@UseGuards(AdminGuard)
export class AdminUsersController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Get()
  list() {
    return this.queryBus.execute(new ListAccountsQuery());
  }

  @Get(':id/activity')
  activity(@Param('id') id: string) {
    return this.queryBus.execute(new GetAccountActivityQuery(id, 200));
  }

  @Post(':id/unlock')
  async unlock(@CurrentUser() admin: AuthUser, @Param('id') id: string) {
    await this.commandBus.execute(new UnlockAccountCommand(id, admin.sub));
    return { ok: true };
  }

  @Patch(':id')
  async update(@CurrentUser() admin: AuthUser, @Param('id') id: string, @Body() body: unknown) {
    if (id === admin.sub) throw new BadRequestException('Impossible de modifier son propre compte');
    const input = parseOrBadRequest(updateUserSchema, body);

    if (input.status === 'SUSPENDED') {
      await this.commandBus.execute(new SuspendAccountCommand(id, admin.sub));
    } else if (input.status === 'ACTIVE') {
      await this.commandBus.execute(new UnsuspendAccountCommand(id, admin.sub));
    }
    if (input.role) {
      await this.commandBus.execute(new ChangeRoleCommand(id, input.role, admin.sub));
    }

    return { id, role: input.role, status: input.status };
  }

  @Delete(':id')
  async remove(@CurrentUser() admin: AuthUser, @Param('id') id: string) {
    if (id === admin.sub) throw new BadRequestException('Impossible de supprimer son propre compte');
    await this.commandBus.execute(new DeleteAccountCommand(id, admin.sub));
    return { ok: true };
  }
}
