'use server';

import { signIn } from '@/lib/auth';
import { AuthError } from 'next-auth';
import type { LoginInput } from '@/lib/validations/auth';

/**
 * Server Action de connexion.
 * Retourne `{ error: string }` en cas d'échec ou redirige vers `/` en cas de succès.
 */
export async function loginAction(
  data: LoginInput,
): Promise<{ error: string } | undefined> {
  try {
    await signIn('credentials', { ...data, redirectTo: '/' });
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case 'CredentialsSignin':
          return { error: 'Pseudo ou mot de passe incorrect' };
        default:
          return { error: 'Une erreur est survenue, réessaie.' };
      }
    }
    // Re-throw les erreurs de redirection Next.js (NEXT_REDIRECT)
    throw error;
  }
}
