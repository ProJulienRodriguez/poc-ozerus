/* Pose/efface les cookies d'auth. On garde la stratégie access+refresh de Lumina
   mais transportée en cookies httpOnly (compatible SSR Astro) plutôt qu'en body. */
import type { Response } from 'express';

export const ACCESS_COOKIE = 'access_token';
export const REFRESH_COOKIE = 'refresh_token';
export const TRUSTED_DEVICE_COOKIE = 'trusted_device';

/** Refresh sur tout le site : il sert aussi de filtre « connecté » au middleware
    SSR Astro (l'access expire en 15 min, le refresh dure 7 j). httpOnly + n'est
    exploitable que par POST /api/auth/refresh. */
const REFRESH_PATH = '/';

const isProd = (): boolean => process.env.NODE_ENV === 'production';

export function setAccessCookie(res: Response, token: string, maxAgeSeconds: number): void {
  res.cookie(ACCESS_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: isProd(),
    maxAge: maxAgeSeconds * 1000,
    path: '/',
  });
}

export function setRefreshCookie(res: Response, token: string, maxAgeSeconds: number): void {
  res.cookie(REFRESH_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: isProd(),
    maxAge: maxAgeSeconds * 1000,
    path: REFRESH_PATH,
  });
}

export function clearAuthCookies(res: Response): void {
  res.clearCookie(ACCESS_COOKIE, { path: '/' });
  res.clearCookie(REFRESH_COOKIE, { path: REFRESH_PATH });
}

/** Cookie d'appareil de confiance (sauter le MFA) — porté sur /api/auth pour le login. */
export function setTrustedDeviceCookie(res: Response, token: string, maxAgeSeconds: number): void {
  res.cookie(TRUSTED_DEVICE_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: isProd(),
    maxAge: maxAgeSeconds * 1000,
    path: '/api/auth',
  });
}
