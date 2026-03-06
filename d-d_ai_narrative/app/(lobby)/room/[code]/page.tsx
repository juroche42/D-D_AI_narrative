import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { joinRoom } from '@/lib/services/room';

interface Props {
  params: Promise<{ code: string }>;
}

/**
 * Route d'entrée via lien d'invitation (/room/[code]).
 * Rejoint automatiquement le salon et redirige vers /lobby/[code].
 * Si l'utilisateur n'est pas connecté → /login?callbackUrl=/room/[code].
 * Si erreur (salon plein, inexistant...) → /lobby?error=...
 */
export default async function JoinViaLinkPage({ params }: Props) {
  const { code } = await params;
  const session = await auth();

  if (!session?.user) {
    redirect(`/login?callbackUrl=/room/${code}`);
  }

  try {
    await joinRoom(code, session.user.id);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Impossible de rejoindre ce salon';
    redirect(`/lobby?error=${encodeURIComponent(message)}`);
  }

  redirect(`/lobby/${code.toUpperCase()}`);
}
