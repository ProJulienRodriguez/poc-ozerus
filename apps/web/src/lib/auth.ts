import { cookies } from 'next/headers';
import type { AuthUser } from '@/mocks/types';
import { ACCESS_COOKIE, REFRESH_COOKIE } from './auth-constants';
import { apiFetch } from './server-api';

export { ACCESS_COOKIE, REFRESH_COOKIE };
export type { AuthUser };

/** Forme renvoyée par l'API identity (GET /api/auth/me). */
interface PublicUser {
  id: string;
  email: string;
  name: string;
  role: 'LEARNER' | 'TRAINER' | 'ADMIN';
  initials: string;
}

/** Mappe l'utilisateur de l'API vers le modèle attendu par le front. */
function toAuthUser(u: PublicUser): AuthUser {
  return {
    id: u.id,
    email: u.email,
    name: u.name,
    org: 'Ozerus',
    role: u.role === 'ADMIN' ? 'admin' : 'partner',
  };
}

/** Présence d'une session (cookie d'accès ou de refresh). */
export function hasSessionCookie(): boolean {
  const jar = cookies();
  return Boolean(jar.get(ACCESS_COOKIE)?.value || jar.get(REFRESH_COOKIE)?.value);
}

/** Récupère l'utilisateur courant auprès de l'API (cookies relayés). */
export async function fetchMe(): Promise<AuthUser | null> {
  if (!hasSessionCookie()) return null;
  try {
    const res = await apiFetch('/auth/me', { method: 'GET' });
    if (!res.ok) return null;
    const data = (await res.json()) as PublicUser;
    return toAuthUser(data);
  } catch {
    return null;
  }
}
