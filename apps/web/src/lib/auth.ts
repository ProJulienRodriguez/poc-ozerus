import { cookies } from 'next/headers';
import { AUTH_USERS } from '@/mocks/users';
import type { AuthUser } from '@/mocks/types';
import { TOKEN_COOKIE, MFA_CODE } from './auth-constants';

export { TOKEN_COOKIE, MFA_CODE };
export type { AuthUser };

export function encodeToken(user: AuthUser): string {
  return Buffer.from(JSON.stringify(user), 'utf8').toString('base64url');
}

export function decodeToken(token: string): AuthUser | null {
  try {
    const json = Buffer.from(token, 'base64url').toString('utf8');
    const u = JSON.parse(json);
    if (!u?.id || !u?.email) return null;
    return u as AuthUser;
  } catch {
    return null;
  }
}

export function readToken(): string | null {
  return cookies().get(TOKEN_COOKIE)?.value ?? null;
}

export async function fetchMe(token: string): Promise<AuthUser | null> {
  return decodeToken(token);
}

export function resolveUser(email: string): AuthUser {
  const normalized = email.trim().toLowerCase();
  const existing = AUTH_USERS[normalized];
  if (existing) return existing;
  const base = normalized.split('@')[0] ?? 'utilisateur';
  const name = base.replace(/[._-]+/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  return {
    id: `u-${Buffer.from(normalized).toString('base64url').slice(0, 10)}`,
    email: normalized,
    name: name || 'Utilisateur',
    org: 'Cabinet POC',
    role: 'partner',
  };
}
