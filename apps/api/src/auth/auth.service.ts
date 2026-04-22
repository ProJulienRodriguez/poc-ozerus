import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { MFA_CODE } from './auth.constants';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  org: string;
  role: 'partner' | 'admin';
}

const USERS: Record<string, AuthUser> = {
  'marie.laurent@helios.fr': { id: 'u-1', email: 'marie.laurent@helios.fr', name: 'Marie Laurent', org: 'Cabinet Helios', role: 'partner' },
  'pierre.dubois@helios.fr': { id: 'u-2', email: 'pierre.dubois@helios.fr', name: 'Pierre Dubois', org: 'Cabinet Helios', role: 'partner' },
  'admin@ozerus.fr': { id: 'u-99', email: 'admin@ozerus.fr', name: 'Admin Ozerus', org: 'Ozerus', role: 'admin' },
};

const MFA_CHALLENGES = new Map<string, { email: string; expiresAt: number }>();

@Injectable()
export class AuthService {
  constructor(private readonly jwt: JwtService) {}

  startLogin(email: string, password: string): { challengeId: string; hint: string } {
    if (!email || !password || password.length < 4) {
      throw new UnauthorizedException('Identifiants invalides.');
    }
    const normalized = email.trim().toLowerCase();
    const challengeId = `mfa-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    MFA_CHALLENGES.set(challengeId, { email: normalized, expiresAt: Date.now() + 5 * 60 * 1000 });
    return { challengeId, hint: `Code MFA envoyé (utilisez ${MFA_CODE} pour la démo)` };
  }

  completeLogin(challengeId: string, code: string): { token: string; user: AuthUser } {
    const challenge = MFA_CHALLENGES.get(challengeId);
    if (!challenge) throw new UnauthorizedException('Session MFA introuvable.');
    if (challenge.expiresAt < Date.now()) {
      MFA_CHALLENGES.delete(challengeId);
      throw new UnauthorizedException('Session MFA expirée.');
    }
    if (code !== MFA_CODE) throw new UnauthorizedException('Code MFA incorrect.');

    MFA_CHALLENGES.delete(challengeId);
    const user = USERS[challenge.email] ?? {
      id: `u-${Date.now()}`,
      email: challenge.email,
      name: challenge.email.split('@')[0].replace('.', ' ').replace(/\b\w/g, c => c.toUpperCase()),
      org: 'Cabinet POC',
      role: 'partner' as const,
    };
    const token = this.jwt.sign({ sub: user.id, email: user.email, role: user.role });
    return { token, user };
  }

  verify(token: string): AuthUser {
    try {
      const payload = this.jwt.verify<{ sub: string; email: string; role: string }>(token);
      const user = Object.values(USERS).find(u => u.id === payload.sub || u.email === payload.email);
      return user ?? {
        id: payload.sub,
        email: payload.email,
        name: payload.email.split('@')[0],
        org: 'Cabinet POC',
        role: (payload.role as 'partner' | 'admin') ?? 'partner',
      };
    } catch {
      throw new UnauthorizedException('Session invalide.');
    }
  }
}
