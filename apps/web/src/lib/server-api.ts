import { cookies } from 'next/headers';

/**
 * Couche proxy côté serveur Next : les appels à l'API NestJS se font
 * server-to-server. Les cookies httpOnly d'auth (posés par l'API) sont relayés
 * vers le navigateur via le domaine Next, et renvoyés à l'API à chaque appel.
 */

// En docker, le web atteint l'API via API_PROXY_URL (ex. http://api:4000).
// En dev local, on vise l'API locale. L'API expose un préfixe global « /api ».
const API_BASE = process.env.API_PROXY_URL ?? 'http://localhost:4099';

// Cookies d'auth gérés (cf. apps/api .../presentation/cookies.ts).
const AUTH_COOKIES = ['access_token', 'refresh_token', 'trusted_device'];

export function apiUrl(path: string): string {
  return `${API_BASE}/api${path.startsWith('/') ? path : `/${path}`}`;
}

/** En-tête Cookie reconstruit à partir des cookies d'auth présents côté Next. */
function buildCookieHeader(): string {
  const jar = cookies();
  return AUTH_COOKIES.map((name) => {
    const v = jar.get(name)?.value;
    return v ? `${name}=${v}` : null;
  })
    .filter(Boolean)
    .join('; ');
}

/** Appel serveur vers l'API en transférant les cookies d'auth entrants. */
export async function apiFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const cookieHeader = buildCookieHeader();
  return fetch(apiUrl(path), {
    ...init,
    headers: {
      'content-type': 'application/json',
      ...(cookieHeader ? { cookie: cookieHeader } : {}),
      ...(init.headers ?? {}),
    },
    cache: 'no-store',
  });
}

/** Parse un en-tête Set-Cookie « nom=val; Path=/; Max-Age=...; ... ». */
function parseSetCookie(raw: string): {
  name: string;
  value: string;
  path: string;
  maxAge?: number;
} | null {
  const parts = raw.split(';').map((p) => p.trim());
  const [pair, ...attrs] = parts;
  const eq = pair.indexOf('=');
  if (eq < 0) return null;
  const name = pair.slice(0, eq);
  const value = pair.slice(eq + 1);
  let path = '/';
  let maxAge: number | undefined;
  for (const attr of attrs) {
    const [k, v] = attr.split('=');
    const key = k.toLowerCase();
    if (key === 'path' && v) path = v;
    else if (key === 'max-age' && v) maxAge = Number(v);
  }
  return { name, value, path, maxAge };
}

/**
 * Relaie les cookies posés par l'API vers le navigateur (domaine Next).
 * `Secure` est volontairement retiré : la stack tourne en HTTP en local/docker.
 * À utiliser uniquement dans une server action (cookies() mutable).
 */
export function forwardSetCookies(res: Response): void {
  const setCookies = res.headers.getSetCookie?.() ?? [];
  const jar = cookies();
  for (const raw of setCookies) {
    const parsed = parseSetCookie(raw);
    if (!parsed) continue;
    // value vide + Max-Age 0 => suppression (logout / clearAuthCookies).
    if (parsed.value === '' || parsed.maxAge === 0) {
      jar.delete(parsed.name);
      continue;
    }
    jar.set(parsed.name, parsed.value, {
      httpOnly: true,
      sameSite: 'lax',
      secure: false,
      path: parsed.path,
      ...(parsed.maxAge ? { maxAge: parsed.maxAge } : {}),
    });
  }
}
