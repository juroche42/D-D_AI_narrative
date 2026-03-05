import { auth } from '@/lib/auth';
import { redirect, notFound } from 'next/navigation';
import { getRoomByCode } from '@/lib/services/room';
import { RoomLobby } from '@/components/lobby/RoomLobby';

// Next.js 16 — params est une Promise
interface Props {
  params: Promise<{ code: string }>;
}

export default async function RoomPage({ params }: Props) {
  const { code } = await params;
  const session = await auth();
  if (!session?.user) redirect('/login');

  let room;
  try {
    room = await getRoomByCode(code);
  } catch {
    notFound();
  }

  return (
    <RoomLobby
      room={room}
      currentUser={{ id: session.user.id, username: session.user.username }}
    />
  );
}
