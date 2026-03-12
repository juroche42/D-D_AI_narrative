import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { GameView } from '@/components/game/GameView';

interface GamePageProps {
  params: Promise<{ code: string }>;
}

export default async function GamePage({ params }: GamePageProps) {
  const session = await auth();
  if (!session?.user) redirect('/login');

  const { code } = await params;
  const roomCode = code.toUpperCase();

  const room = await prisma.room.findUnique({
    where: { code: roomCode },
    select: { id: true, status: true, name: true },
  });

  if (!room || room.status !== 'IN_PROGRESS') redirect('/lobby');

  const isMember = await prisma.roomPlayer.findFirst({
    where: { roomId: room.id, userId: session.user.id },
    select: { id: true },
  });

  if (!isMember) redirect('/lobby');

  return <GameView roomCode={roomCode} roomName={room.name} />;
}
