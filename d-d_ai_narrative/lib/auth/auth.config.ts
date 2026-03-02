import type { NextAuthConfig } from 'next-auth';

/** Routes accessibles sans authentification */
const PUBLIC_PATHS = [
  '/login',
  '/register',
  '/api/auth',
  '/api/health',
  '/api/docs',
  '/api/swagger',
  '/api-docs',
];

const AUTH_ONLY_PATHS = ['/login', '/register'];

export const authConfig: NextAuthConfig = {
  providers: [],
  session: { strategy: 'jwt' },
  pages: { signIn: '/login' },
  callbacks: {
    authorized({ auth, request }) {
      const { pathname } = request.nextUrl;
      if (request.method === 'OPTIONS') return true; // Authorize CORS preflight requests

      if (auth?.user && AUTH_ONLY_PATHS.some((p) => pathname.startsWith(p))) {
        return Response.redirect(new URL('/', request.nextUrl));
      }

      if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) return true;
      return !!auth?.user;
    },
  },
};
