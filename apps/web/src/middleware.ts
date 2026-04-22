import { NextRequest, NextResponse } from 'next/server';
import { TOKEN_COOKIE } from './lib/auth-constants';

const PROTECTED = ['/dashboard', '/products', '/reports', '/portfolio', '/users'];

function isValidToken(token: string | undefined): boolean {
  if (!token) return false;
  try {
    const base64 = token.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64 + '=='.slice(0, (4 - (base64.length % 4)) % 4);
    const json = atob(padded);
    const obj = JSON.parse(json);
    return Boolean(obj?.id && obj?.email);
  } catch {
    return false;
  }
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const needsAuth = PROTECTED.some(p => pathname === p || pathname.startsWith(`${p}/`));
  const tokenRaw = req.cookies.get(TOKEN_COOKIE)?.value;
  const tokenValid = isValidToken(tokenRaw);

  if (tokenRaw && !tokenValid) {
    const url = req.nextUrl.clone();
    url.pathname = '/login';
    url.search = '';
    const res = NextResponse.redirect(url);
    res.cookies.delete(TOKEN_COOKIE);
    return res;
  }

  if (needsAuth && !tokenValid) {
    const url = req.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('next', pathname);
    return NextResponse.redirect(url);
  }

  if (pathname === '/login' && tokenValid) {
    const url = req.nextUrl.clone();
    url.pathname = '/dashboard';
    url.search = '';
    return NextResponse.redirect(url);
  }

  if (pathname === '/') {
    const url = req.nextUrl.clone();
    url.pathname = tokenValid ? '/dashboard' : '/login';
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/', '/login', '/dashboard/:path*', '/products/:path*', '/reports/:path*', '/portfolio/:path*', '/users/:path*'],
};
