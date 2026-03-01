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

export const authConfig: NextAuthConfig = {
  providers: [],
  session: { strategy: 'jwt' },
  pages: { signIn: '/login' },
  callbacks: {
    authorized({ auth, request }) {
      const { pathname } = request.nextUrl;
      if (request.method === 'OPTIONS') return true; // Authorize CORS preflight requests
      if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) return true;
      return !!auth?.user;
    },
  },
};
