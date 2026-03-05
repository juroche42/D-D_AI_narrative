import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { LobbyEntrance } from '@/components/lobby/LobbyEntrance';

export default async function LobbyPage() {
  const session = await auth();
  if (!session?.user) redirect('/login');

  return <LobbyEntrance username={session.user.username} />;
}
