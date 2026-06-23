import {
  Body,
  Controller,
  Get,
  Inject,
  Post,
  Put,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { Throttle } from '@nestjs/throttler';
import { Role } from '@prisma/client';
import type { Request, Response } from 'express';
import { parseOrBadRequest } from '../../../../core/validation';
import { ActivateAccountCommand } from '../../application/commands/activate-account/activate-account.command';
import { ChangePasswordCommand } from '../../application/commands/change-password/change-password.command';
import { LoginCommand } from '../../application/commands/login/login.command';
import { RegisterViaInviteCommand } from '../../application/commands/register-via-invite/register-via-invite.command';
import { ResetPasswordCommand } from '../../application/commands/reset-password/reset-password.command';
import { RevokeAllSessionsCommand } from '../../application/commands/revoke-all-sessions/revoke-all-sessions.command';
import { VerifyMfaChallengeCommand } from '../../application/commands/verify-mfa-challenge/verify-mfa-challenge.command';
import { ACTIVITY_LOG_LIMIT, TRUSTED_DEVICE_TTL_SECONDS } from '../../application/identity.constants';
import { GetMeQuery } from '../../application/queries/get-me/get-me.query';
import { GetMyActivityQuery } from '../../application/queries/get-my-activity/get-my-activity.query';
import { AuthUser, PublicUser, initialsOf } from '../../domain/auth-user';
import {
  ACCOUNT_REPOSITORY,
  AccountRepositoryPort,
} from '../../domain/ports/account.repository.port';
import { AuditLogView } from '../../domain/ports/audit.repository.port';
import {
  REVOKED_TOKEN_REPOSITORY,
  RevokedTokenRepositoryPort,
} from '../../domain/ports/revoked-token.repository.port';
import { JwtTokenService } from '../../infrastructure/jwt/jwt-token.service';
import { hashToken } from '../../infrastructure/utils/hash-token.util';
import {
  REFRESH_COOKIE,
  TRUSTED_DEVICE_COOKIE,
  clearAuthCookies,
  setAccessCookie,
  setRefreshCookie,
  setTrustedDeviceCookie,
} from '../cookies';
import { AccessTokenGuard, CurrentUser } from '../guards/access-token.guard';
import {
  activateSchema,
  changePasswordSchema,
  loginSchema,
  mfaChallengeSchema,
  registerSchema,
  resetPasswordSchema,
} from '../schemas/auth.schemas';

interface SessionUser {
  sub: string;
  email: string;
  name: string;
  role: Role;
}

type LoginHttpResponse =
  | PublicUser
  | { mfaRequired: true; mfaToken: string; mfaExpiresInSeconds: number };

@Controller('auth')
export class AuthController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
    private readonly tokens: JwtTokenService,
    @Inject(REVOKED_TOKEN_REPOSITORY)
    private readonly revoked: RevokedTokenRepositoryPort,
    @Inject(ACCOUNT_REPOSITORY)
    private readonly accounts: AccountRepositoryPort,
  ) {}

  /** Pose les cookies access + refresh pour une session authentifiée. */
  private issueSession(res: Response, user: SessionUser): void {
    setAccessCookie(
      res,
      this.tokens.generateAccessToken(user),
      this.tokens.accessExpiresInSeconds,
    );
    setRefreshCookie(
      res,
      this.tokens.generateRefreshToken(user.sub),
      this.tokens.refreshExpiresInSeconds,
    );
  }

  private readCookie(req: Request, name: string): string | undefined {
    return (req as Request & { cookies?: Record<string, string> }).cookies?.[name];
  }

  private toPublic(user: SessionUser): PublicUser {
    return {
      id: user.sub,
      email: user.email,
      name: user.name,
      role: user.role,
      initials: initialsOf(user.name),
    };
  }

  @Post('login')
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  async login(
    @Body() body: unknown,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<LoginHttpResponse> {
    const input = parseOrBadRequest(loginSchema, body);

    // Appareil de confiance : si le cookie est valide, le MFA pourra être sauté.
    const tdCookie = this.readCookie(req, TRUSTED_DEVICE_COOKIE);
    const trusted = tdCookie ? this.tokens.verifyTrustedDeviceToken(tdCookie) : null;

    const result = await this.commandBus.execute(
      new LoginCommand(
        input.email,
        input.password,
        req.ip,
        req.headers['user-agent'],
        trusted?.deviceId,
      ),
    );

    const user: SessionUser = {
      sub: result.accountId,
      email: result.email,
      name: result.name,
      role: result.role,
    };

    if (result.requiresMfa) {
      return {
        mfaRequired: true,
        mfaToken: this.tokens.generateMfaPendingToken(user),
        mfaExpiresInSeconds: this.tokens.mfaPendingExpiresInSeconds,
      };
    }

    this.issueSession(res, user);
    return this.toPublic(user);
  }

  /** Valide le second facteur (TOTP ou code de secours) et ouvre la session. */
  @Post('login/mfa')
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  async loginMfa(
    @Body() body: unknown,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<PublicUser> {
    const input = parseOrBadRequest(mfaChallengeSchema, body);
    const pending = this.tokens.verifyMfaPendingToken(input.mfaToken);

    const result = await this.commandBus.execute(
      new VerifyMfaChallengeCommand(
        pending.sub,
        input.totpCode ?? null,
        input.recoveryCode ?? null,
        Boolean(input.rememberDevice),
        input.deviceLabel ?? req.headers['user-agent']?.slice(0, 100) ?? null,
        req.ip,
        req.headers['user-agent'],
      ),
    );

    if (result.newTrustedDeviceId) {
      setTrustedDeviceCookie(
        res,
        this.tokens.generateTrustedDeviceToken(
          result.accountId,
          result.newTrustedDeviceId,
          TRUSTED_DEVICE_TTL_SECONDS,
        ),
        TRUSTED_DEVICE_TTL_SECONDS,
      );
    }

    const user: SessionUser = {
      sub: result.accountId,
      email: result.email,
      name: result.name,
      role: result.role,
    };
    this.issueSession(res, user);
    return this.toPublic(user);
  }

  @Post('refresh')
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<{ ok: true }> {
    const cookies = (req as Request & { cookies?: Record<string, string> }).cookies;
    const refreshToken = cookies?.[REFRESH_COOKIE];
    if (!refreshToken) throw new UnauthorizedException('Refresh token absent');

    const tokenHash = hashToken(refreshToken);
    if (await this.revoked.isRevoked(tokenHash)) {
      throw new UnauthorizedException('Refresh token révoqué');
    }

    const payload = this.tokens.verifyRefreshToken(refreshToken);
    const account = await this.accounts.findById(payload.sub);
    if (!account || account.status === 'SUSPENDED') {
      throw new UnauthorizedException('Compte suspendu ou supprimé');
    }
    // « Déconnexion partout » : un refresh émis avant l'épochè n'est plus valable.
    if (
      account.sessionsValidAfter &&
      payload.iat * 1000 < account.sessionsValidAfter.getTime()
    ) {
      throw new UnauthorizedException('Session révoquée');
    }

    // Rotation : on révoque l'ancien refresh et on en émet un nouveau.
    await this.revoked.revoke(tokenHash, new Date(payload.exp * 1000));
    this.issueSession(res, {
      sub: account.id,
      email: account.email,
      name: account.name,
      role: account.role,
    });
    return { ok: true };
  }

  @Post('logout')
  async logout(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<{ ok: true }> {
    const cookies = (req as Request & { cookies?: Record<string, string> }).cookies;
    const refreshToken = cookies?.[REFRESH_COOKIE];
    if (refreshToken) {
      try {
        const payload = this.tokens.verifyRefreshToken(refreshToken);
        await this.revoked.revoke(hashToken(refreshToken), new Date(payload.exp * 1000));
      } catch {
        // token déjà invalide/expiré : rien à révoquer
      }
    }
    clearAuthCookies(res);
    return { ok: true };
  }

  /** Inscription via invitation : crée le compte ACTIVE et ouvre la session. */
  @Post('register')
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  async register(
    @Body() body: unknown,
    @Res({ passthrough: true }) res: Response,
  ): Promise<PublicUser> {
    const input = parseOrBadRequest(registerSchema, body);
    const result = await this.commandBus.execute(
      new RegisterViaInviteCommand(input.token, input.name, input.email, input.password),
    );
    const user: SessionUser = {
      sub: result.accountId,
      email: result.email,
      name: result.name,
      role: result.role,
    };
    this.issueSession(res, user);
    return this.toPublic(user);
  }

  /** Active un compte créé par un admin : définit le mot de passe. */
  @Post('activate')
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  async activate(@Body() body: unknown): Promise<{ ok: true }> {
    const input = parseOrBadRequest(activateSchema, body);
    await this.commandBus.execute(new ActivateAccountCommand(input.token, input.password));
    return { ok: true };
  }

  /** Définit un nouveau mot de passe via un lien de réinitialisation. */
  @Post('reset-password')
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  async resetPassword(@Body() body: unknown): Promise<{ ok: true }> {
    const input = parseOrBadRequest(resetPasswordSchema, body);
    await this.commandBus.execute(new ResetPasswordCommand(input.token, input.newPassword));
    return { ok: true };
  }

  /** Change le mot de passe de l'utilisateur connecté. */
  @Put('change-password')
  @UseGuards(AccessTokenGuard)
  async changePassword(
    @CurrentUser() user: AuthUser,
    @Body() body: unknown,
  ): Promise<{ ok: true }> {
    const input = parseOrBadRequest(changePasswordSchema, body);
    await this.commandBus.execute(
      new ChangePasswordCommand(user.sub, input.currentPassword, input.newPassword),
    );
    return { ok: true };
  }

  @Get('me')
  @UseGuards(AccessTokenGuard)
  me(@CurrentUser() user: AuthUser): Promise<PublicUser> {
    return this.queryBus.execute(new GetMeQuery(user.sub));
  }

  /** Déconnecte toutes les sessions du compte (cet appareil compris). */
  @Post('logout-all')
  @UseGuards(AccessTokenGuard)
  async logoutAll(
    @CurrentUser() user: AuthUser,
    @Res({ passthrough: true }) res: Response,
  ): Promise<{ ok: true }> {
    await this.commandBus.execute(new RevokeAllSessionsCommand(user.sub));
    clearAuthCookies(res);
    return { ok: true };
  }

  /** Journal d'activité personnel (connexions & actions de sécurité). */
  @Get('activity')
  @UseGuards(AccessTokenGuard)
  activity(@CurrentUser() user: AuthUser): Promise<AuditLogView[]> {
    return this.queryBus.execute(new GetMyActivityQuery(user.sub, ACTIVITY_LOG_LIMIT));
  }
}
