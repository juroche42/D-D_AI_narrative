'use server';

import { signOut } from '@/lib/auth';

/**
 * Déconnecte l'utilisateur via NextAuth v5 et redirige vers la home.
 * Server Action — appelée depuis LogoutButton côté client.
 *
 * signOut() doit être appelé côté serveur (Server Action) pour que
 * le cookie de session soit invalidé avant la redirection.
 */
export async function logoutAction(): Promise<void> {
  await signOut({ redirectTo: '/' });
}
