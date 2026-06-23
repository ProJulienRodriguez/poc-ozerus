import { NextRequest, NextResponse } from 'next/server';

const API_BASE = process.env.API_PROXY_URL ?? 'http://localhost:4099';

function targetUrl(req: NextRequest, path: string[]): string {
  const search = req.nextUrl.search ?? '';
  return `${API_BASE}/api/${path.join('/')}${search}`;
}

function relaxSecure(setCookie: string): string {
  return setCookie
    .split(';')
    .filter((p) => p.trim().toLowerCase() !== 'secure')
    .join(';');
}

async function proxy(req: NextRequest, path: string[]): Promise<NextResponse> {
  const method = req.method;
  const hasBody = !['GET', 'HEAD'].includes(method);

  let upstream: Response;
  try {
    upstream = await fetch(targetUrl(req, path), {
      method,
      headers: {
        ...(req.headers.get('content-type')
          ? { 'content-type': req.headers.get('content-type') as string }
          : {}),
        ...(req.headers.get('cookie') ? { cookie: req.headers.get('cookie') as string } : {}),
      },
      body: hasBody ? await req.text() : undefined,
      redirect: 'manual',
      cache: 'no-store',
    });
  } catch {
    return NextResponse.json({ message: 'API injoignable.' }, { status: 502 });
  }

  const bodyText = await upstream.text();
  const res = new NextResponse(bodyText, {
    status: upstream.status,
    headers: {
      'content-type': upstream.headers.get('content-type') ?? 'application/json',
    },
  });
  for (const sc of upstream.headers.getSetCookie?.() ?? []) {
    res.headers.append('set-cookie', relaxSecure(sc));
  }
  return res;
}

type Ctx = { params: { path: string[] } };

export const GET = (req: NextRequest, { params }: Ctx) => proxy(req, params.path);
export const POST = (req: NextRequest, { params }: Ctx) => proxy(req, params.path);
export const PUT = (req: NextRequest, { params }: Ctx) => proxy(req, params.path);
export const PATCH = (req: NextRequest, { params }: Ctx) => proxy(req, params.path);
export const DELETE = (req: NextRequest, { params }: Ctx) => proxy(req, params.path);

export const dynamic = 'force-dynamic';
