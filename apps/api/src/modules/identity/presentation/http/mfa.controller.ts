import { Body, Controller, Delete, Get, Param, Post, UseGuards } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import * as QRCode from 'qrcode';
import { parseOrBadRequest } from '../../../../core/validation';
import { ConfirmMfaCommand } from '../../application/commands/confirm-mfa/confirm-mfa.command';
import { DisableMfaCommand } from '../../application/commands/disable-mfa/disable-mfa.command';
import { EnrollMfaCommand } from '../../application/commands/enroll-mfa/enroll-mfa.command';
import { RegenerateRecoveryCodesCommand } from '../../application/commands/regenerate-recovery-codes/regenerate-recovery-codes.command';
import { RevokeTrustedDeviceCommand } from '../../application/commands/revoke-trusted-device/revoke-trusted-device.command';
import { GetMfaStatusQuery } from '../../application/queries/get-mfa-status/get-mfa-status.query';
import { GetTrustedDevicesQuery } from '../../application/queries/get-trusted-devices/get-trusted-devices.query';
import { AuthUser } from '../../domain/auth-user';
import { TrustedDeviceView } from '../../domain/ports/trusted-device.repository.port';
import { AccessTokenGuard, CurrentUser } from '../guards/access-token.guard';
import { confirmMfaSchema, disableMfaSchema } from '../schemas/auth.schemas';

/** Gestion du MFA (TOTP) pour l'utilisateur connecté. */
@Controller('mfa')
@UseGuards(AccessTokenGuard)
export class MfaController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  /** Statut MFA du compte courant. */
  @Get('status')
  status(@CurrentUser() user: AuthUser): Promise<{ enabled: boolean }> {
    return this.queryBus.execute(new GetMfaStatusQuery(user.sub));
  }

  /** Démarre l'enrôlement : renvoie l'URI otpauth + un QR code (data URL) + le secret. */
  @Post('enroll')
  async enroll(
    @CurrentUser() user: AuthUser,
  ): Promise<{ otpauthUri: string; qrDataUrl: string; secret: string }> {
    const result = await this.commandBus.execute(new EnrollMfaCommand(user.sub));
    const qrDataUrl = await QRCode.toDataURL(result.otpauthUri);
    return { otpauthUri: result.otpauthUri, qrDataUrl, secret: result.secret };
  }

  /** Confirme l'enrôlement via un premier code et renvoie les codes de secours. */
  @Post('confirm')
  async confirm(
    @CurrentUser() user: AuthUser,
    @Body() body: unknown,
  ): Promise<{ recoveryCodes: string[] }> {
    const input = parseOrBadRequest(confirmMfaSchema, body);
    return this.commandBus.execute(new ConfirmMfaCommand(user.sub, input.code));
  }

  /** Désactive le MFA (code TOTP ou code de secours requis). */
  @Post('disable')
  async disable(@CurrentUser() user: AuthUser, @Body() body: unknown): Promise<{ ok: true }> {
    const input = parseOrBadRequest(disableMfaSchema, body);
    await this.commandBus.execute(new DisableMfaCommand(user.sub, input.code));
    return { ok: true };
  }

  /** Régénère les codes de secours (invalide les précédents). Code TOTP ou de secours requis. */
  @Post('recovery-codes/regenerate')
  regenerateRecoveryCodes(
    @CurrentUser() user: AuthUser,
    @Body() body: unknown,
  ): Promise<{ recoveryCodes: string[] }> {
    const input = parseOrBadRequest(disableMfaSchema, body);
    return this.commandBus.execute(new RegenerateRecoveryCodesCommand(user.sub, input.code));
  }

  /** Liste les appareils de confiance (qui sautent le MFA) du compte. */
  @Get('trusted-devices')
  trustedDevices(@CurrentUser() user: AuthUser): Promise<TrustedDeviceView[]> {
    return this.queryBus.execute(new GetTrustedDevicesQuery(user.sub));
  }

  /** Révoque un appareil de confiance précis. */
  @Delete('trusted-devices/:id')
  async revokeTrustedDevice(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
  ): Promise<{ ok: true }> {
    await this.commandBus.execute(new RevokeTrustedDeviceCommand(user.sub, id));
    return { ok: true };
  }
}
