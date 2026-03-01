import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcrypt';
import { LoginSchema } from '@/lib/validations/auth';
import { authConfig } from './auth.config';

/** Hash invalide utilisé pour éviter les timing attacks lorsque l'utilisateur n'existe pas */
const DUMMY_HASH = '$2b$12$invalidhashpreventstimingattac000000000000000000000000';

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      async authorize(credentials) {
        const parsed = LoginSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const { username, password } = parsed.data;
        const user = await prisma.user.findUnique({ where: { username } });

        const ok = await bcrypt.compare(password, user?.password ?? DUMMY_HASH);
        if (!user || !ok) return null;

        return { id: user.id, username: user.username, createdAt: user.createdAt };
      },
    }),
  ],
  callbacks: {
    ...authConfig.callbacks,
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.username = (user as { username: string }).username;
      }
      return token;
    },
    session({ session, token }) {
      session.user.id = token.id as string;
      session.user.username = token.username as string;
      return session;
    },
  },
});
