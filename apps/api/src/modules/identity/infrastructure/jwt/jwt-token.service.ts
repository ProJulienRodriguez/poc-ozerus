/* Signature/vérification des JWT — calque de la stratégie Lumina :
   access court + refresh long + token MFA pending. HS256, secret JWT_SECRET. */
import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { JwtService, type JwtSignOptions } from '@nestjs/jwt';
import { Role } from '@prisma/client';

export interface AccessTokenPayload {
  sub: string;
  email: string;
  name: string;
  role: Role;
  /** Émission (epoch secondes) — présent sur les tokens vérifiés, sert à « déconnexion partout ». */
  iat?: number;
}

export interface RefreshTokenPayload {
  sub: string;
  type: 'refresh';
  exp: number;
  iat: number;
}

export interface MfaPendingTokenPayload {
  sub: string;
  email: string;
  name: string;
  role: Role;
  type: 'mfa-pending';
  exp: number;
}

export interface TrustedDeviceTokenPayload {
  sub: string;
  deviceId: string;
  type: 'trusted-device';
  exp: number;
}

@Injectable()
export class JwtTokenService {
  private readonly logger = new Logger(JwtTokenService.name);
  private readonly accessExpiration = process.env.JWT_ACCESS_EXPIRATION ?? '4h';
  private readonly refreshExpiration = process.env.JWT_REFRESH_EXPIRATION ?? '7d';
  private readonly mfaPendingExpirationSeconds = Number(
    process.env.JWT_MFA_PENDING_EXPIRATION_SECONDS ?? 300,
  );

  constructor(private readonly jwt: JwtService) {}

  private get secret(): string {
    const s = process.env.JWT_SECRET;
    if (!s) throw new Error('JWT_SECRET manquant');
    return s;
  }

  generateAccessToken(p: AccessTokenPayload): string {
    return this.jwt.sign({ sub: p.sub, email: p.email, name: p.name, role: p.role }, {
      secret: this.secret,
      expiresIn: this.accessExpiration,
    } as JwtSignOptions);
  }

  verifyAccessToken(token: string): AccessTokenPayload {
    try {
      const payload = this.jwt.verify<AccessTokenPayload & { type?: string }>(token, {
        secret: this.secret,
      });
      if (payload.type) throw new UnauthorizedException('Type de token invalide');
      return payload;
    } catch {
      throw new UnauthorizedException('Session invalide ou expirée');
    }
  }

  generateRefreshToken(sub: string): string {
    return this.jwt.sign({ sub, type: 'refresh' }, {
      secret: this.secret,
      expiresIn: this.refreshExpiration,
    } as JwtSignOptions);
  }

  verifyRefreshToken(token: string): RefreshTokenPayload {
    try {
      const payload = this.jwt.verify<RefreshTokenPayload>(token, { secret: this.secret });
      if (payload.type !== 'refresh') throw new UnauthorizedException('Type de token invalide');
      return payload;
    } catch {
      throw new UnauthorizedException('Refresh token invalide ou expiré');
    }
  }

  generateMfaPendingToken(p: { sub: string; email: string; name: string; role: Role }): string {
    return this.jwt.sign(
      { sub: p.sub, email: p.email, name: p.name, role: p.role, type: 'mfa-pending' },
      { secret: this.secret, expiresIn: `${this.mfaPendingExpirationSeconds}s` } as JwtSignOptions,
    );
  }

  verifyMfaPendingToken(token: string): MfaPendingTokenPayload {
    try {
      const payload = this.jwt.verify<MfaPendingTokenPayload>(token, { secret: this.secret });
      if (payload.type !== 'mfa-pending') throw new UnauthorizedException('Type de token invalide');
      return payload;
    } catch {
      throw new UnauthorizedException('Défi MFA invalide ou expiré');
    }
  }

  generateTrustedDeviceToken(sub: string, deviceId: string, ttlSeconds: number): string {
    return this.jwt.sign({ sub, deviceId, type: 'trusted-device' }, {
      secret: this.secret,
      expiresIn: `${ttlSeconds}s`,
    } as JwtSignOptions);
  }

  verifyTrustedDeviceToken(token: string): TrustedDeviceTokenPayload | null {
    try {
      const payload = this.jwt.verify<TrustedDeviceTokenPayload>(token, { secret: this.secret });
      return payload.type === 'trusted-device' ? payload : null;
    } catch {
      return null;
    }
  }

  get accessExpiresInSeconds(): number {
    return this.parseToSeconds(this.accessExpiration);
  }

  get refreshExpiresInSeconds(): number {
    return this.parseToSeconds(this.refreshExpiration);
  }

  get mfaPendingExpiresInSeconds(): number {
    return this.mfaPendingExpirationSeconds;
  }

  private parseToSeconds(duration: string): number {
    const match = /^(\d+)(s|m|h|d)$/.exec(duration);
    if (!match) {
      this.logger.warn(`Durée JWT au format inconnu "${duration}", fallback à 900s`);
      return 900;
    }
    const multipliers: Record<string, number> = { s: 1, m: 60, h: 3600, d: 86400 };
    return Number(match[1]) * (multipliers[match[2]!] ?? 60);
  }
}
