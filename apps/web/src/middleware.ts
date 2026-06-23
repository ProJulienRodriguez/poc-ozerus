import { NextRequest, NextResponse } from 'next/server';
import { ACCESS_COOKIE } from './lib/auth-constants';

const PROTECTED = ['/dashboard', '/products', '/reports', '/portfolio', '/users', '/admin', '/security'];

const GATE_USER = process.env.GATE_USER || 'acelys';
const GATE_PASS = process.env.GATE_PASS || 'Kp9#mVx2-tR7nQ4wL8bH';

function basicAuthOk(req: NextRequest): boolean {
  const header = req.headers.get('authorization');
  if (!header?.startsWith('Basic ')) return false;
  try {
    const [user, ...rest] = atob(header.slice(6)).split(':');
    return user === GATE_USER && rest.join(':') === GATE_PASS;
  } catch {
    return false;
  }
}

// L'access token est un JWT opaque signé par l'API : le middleware ne peut pas
// le valider (pas de secret côté edge). On se contente de gater l'UI sur sa
// présence ; l'API rejette tout token invalide/expiré côté serveur.
function hasSession(req: NextRequest): boolean {
  return Boolean(req.cookies.get(ACCESS_COOKIE)?.value);
}

export function middleware(req: NextRequest) {
  if (!basicAuthOk(req)) {
    return new NextResponse('Authentication required', {
      status: 401,
      headers: { 'WWW-Authenticate': 'Basic realm="poc-ozerus", charset="UTF-8"' },
    });
  }

  const { pathname } = req.nextUrl;
  const needsAuth = PROTECTED.some(p => pathname === p || pathname.startsWith(`${p}/`));
  const authed = hasSession(req);

  if (needsAuth && !authed) {
    const url = req.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('next', pathname);
    return NextResponse.redirect(url);
  }

  if (pathname === '/login' && authed) {
    const url = req.nextUrl.clone();
    url.pathname = '/dashboard';
    url.search = '';
    return NextResponse.redirect(url);
  }

  if (pathname === '/') {
    const url = req.nextUrl.clone();
    url.pathname = authed ? '/dashboard' : '/login';
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|assets/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|woff2?)$).*)'],
};
