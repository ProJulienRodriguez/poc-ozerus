import { Body, Controller, Param, Post, UseGuards } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { parseOrBadRequest } from '../../../../core/validation';
import { CreateAccountCommand } from '../../application/commands/create-account/create-account.command';
import { RequestPasswordResetCommand } from '../../application/commands/request-password-reset/request-password-reset.command';
import { AdminGuard } from '../guards/access-token.guard';
import { createAccountSchema } from '../schemas/auth.schemas';

/** Gestion des comptes par un administrateur (création + réinitialisation). */
@Controller('admin/accounts')
@UseGuards(AdminGuard)
export class AdminAccountsController {
  constructor(private readonly commandBus: CommandBus) {}

  /** Crée un compte PENDING et envoie l'email d'activation. */
  @Post()
  async create(@Body() body: unknown): Promise<{ accountId: string }> {
    const input = parseOrBadRequest(createAccountSchema, body);
    return this.commandBus.execute(
      new CreateAccountCommand(input.email, input.name, input.role),
    );
  }

  /** Déclenche un email de réinitialisation de mot de passe pour le compte. */
  @Post(':id/reset-password')
  async triggerReset(@Param('id') id: string): Promise<{ ok: true }> {
    await this.commandBus.execute(new RequestPasswordResetCommand(id));
    return { ok: true };
  }
}
