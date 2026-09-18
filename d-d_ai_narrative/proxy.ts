import NextAuth from 'next-auth';
import { authConfig } from '@/lib/auth/auth.config';
import { ALPHA_GATE_COOKIE, computeAlphaGateToken, isAlphaGateEnabled } from '@/lib/alphaGate';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const { auth } = NextAuth(authConfig);

const ALPHA_GATE_PATH = '/alpha-gate';

export const proxy = auth(async (req: NextRequest) => {
  const { pathname } = req.nextUrl;

  // Porte d'accès alpha : bloque tout le site tant que le code n'a pas été validé.
  if (isAlphaGateEnabled() && pathname !== ALPHA_GATE_PATH) {
    const expectedToken = await computeAlphaGateToken();
    const cookieToken = req.cookies.get(ALPHA_GATE_COOKIE)?.value;
    if (!expectedToken || cookieToken !== expectedToken) {
      const url = req.nextUrl.clone();
      url.pathname = ALPHA_GATE_PATH;
      url.searchParams.set('next', pathname);
      return NextResponse.redirect(url);
    }
  }

  const startTime = Date.now();
  const requestId = crypto.randomUUID();
  const { method } = req;

  console.log(
    JSON.stringify({
      type: 'request',
      requestId,
      method,
      path: pathname,
      timestamp: new Date().toISOString(),
    }),
  );

  const response = NextResponse.next();

  response.headers.set('X-Request-Id', requestId);
  response.headers.set('X-Response-Time', `${Date.now() - startTime}ms`);

  const allowedOrigins = getAllowedOrigins();
  const origin = req.headers.get('origin');

  if (origin && allowedOrigins.includes(origin)) {
    response.headers.set('Access-Control-Allow-Origin', origin);
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Request-Id');
    response.headers.set('Access-Control-Max-Age', '86400');
    response.headers.set('Vary', 'Origin');
  }

  return response;
});

function getAllowedOrigins(): readonly string[] {
  const raw = process.env.ALLOWED_ORIGINS ?? 'http://localhost:3000';
  return raw.split(',').map((o) => o.trim());
}

export const config = {
  matcher: ['/((?!_next/|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
};
