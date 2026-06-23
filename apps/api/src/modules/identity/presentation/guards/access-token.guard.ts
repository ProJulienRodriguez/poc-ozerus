import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Inject,
  Injectable,
  UnauthorizedException,
  createParamDecorator,
} from '@nestjs/common';
import type { Request } from 'express';
import { AuthUser } from '../../domain/auth-user';
import {
  ACCOUNT_REPOSITORY,
  AccountRepositoryPort,
} from '../../domain/ports/account.repository.port';
import { JwtTokenService } from '../../infrastructure/jwt/jwt-token.service';
import { ACCESS_COOKIE } from '../cookies';

function extractToken(req: Request): string | null {
  const header = req.headers.authorization;
  if (header?.startsWith('Bearer ')) return header.slice(7);
  const cookie = (req as Request & { cookies?: Record<string, string> }).cookies?.[ACCESS_COOKIE];
  return cookie ?? null;
}

/** Vérifie l'access token (cookie ou Bearer) + statut actif en base. */
@Injectable()
export class AccessTokenGuard implements CanActivate {
  constructor(
    protected readonly tokens: JwtTokenService,
    @Inject(ACCOUNT_REPOSITORY) protected readonly accounts: AccountRepositoryPort,
  ) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const req = ctx.switchToHttp().getRequest<Request & { user?: AuthUser }>();
    const token = extractToken(req);
    if (!token) throw new UnauthorizedException('Authentification requise');

    const payload = this.tokens.verifyAccessToken(token);
    // La suspension/suppression est immédiate : on revérifie le statut en base.
    const user = await this.accounts.findById(payload.sub);
    if (!user || user.status === 'SUSPENDED') {
      throw new UnauthorizedException('Compte suspendu ou supprimé');
    }
    // « Déconnexion partout » : tout token émis avant l'épochè de session est rejeté.
    if (
      user.sessionsValidAfter &&
      payload.iat !== undefined &&
      payload.iat * 1000 < user.sessionsValidAfter.getTime()
    ) {
      throw new UnauthorizedException('Session révoquée');
    }
    req.user = { sub: user.id, email: user.email, name: user.name, role: user.role };
    return true;
  }
}

@Injectable()
export class TrainerGuard extends AccessTokenGuard {
  override async canActivate(ctx: ExecutionContext): Promise<boolean> {
    await super.canActivate(ctx);
    const req = ctx.switchToHttp().getRequest<Request & { user: AuthUser }>();
    if (req.user.role !== 'TRAINER' && req.user.role !== 'ADMIN') {
      throw new ForbiddenException('Réservé aux formateurs');
    }
    return true;
  }
}

@Injectable()
export class AdminGuard extends AccessTokenGuard {
  override async canActivate(ctx: ExecutionContext): Promise<boolean> {
    await super.canActivate(ctx);
    const req = ctx.switchToHttp().getRequest<Request & { user: AuthUser }>();
    if (req.user.role !== 'ADMIN') throw new ForbiddenException('Réservé aux administrateurs');
    return true;
  }
}

export const CurrentUser = createParamDecorator((_data: unknown, ctx: ExecutionContext): AuthUser => {
  return ctx.switchToHttp().getRequest<Request & { user: AuthUser }>().user;
});
