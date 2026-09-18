'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

import { ALPHA_GATE_COOKIE, computeAlphaGateToken } from '@/lib/alphaGate';
import { AlphaGateSchema, type AlphaGateInput } from '@/lib/validations/alphaGate';

/**
 * Server Action de validation du code d'accès alpha.
 * Retourne `{ error: string }` en cas d'échec ou redirige en cas de succès.
 */
export async function submitAlphaCode(
  data: AlphaGateInput,
  next: string,
): Promise<{ error: string } | undefined> {
  const parsed = AlphaGateSchema.safeParse(data);
  if (!parsed.success) {
    return { error: 'Code requis' };
  }

  const expectedCode = process.env.ALPHA_ACCESS_CODE;
  if (!expectedCode || parsed.data.code !== expectedCode) {
    return { error: 'Code invalide' };
  }

  const token = await computeAlphaGateToken();
  if (!token) {
    return { error: 'Une erreur est survenue, réessaie.' };
  }

  const cookieStore = await cookies();
  cookieStore.set(ALPHA_GATE_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 180, // 180 jours
  });

  redirect(next.startsWith('/') ? next : '/');
}
