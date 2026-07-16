import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { getActiveLobbyCode } from '@/lib/services/room';
import { LobbyEntrance } from '@/components/lobby/LobbyEntrance';

export default async function LobbyPage() {
  const session = await auth();
  if (!session?.user) redirect('/login');

  // Si le joueur est déjà dans un salon en attente, le renvoyer directement dedans
  const activeCode = await getActiveLobbyCode(session.user.id);
  if (activeCode) redirect(`/lobby/${activeCode}`);

  return <LobbyEntrance username={session.user.username} />;
}
