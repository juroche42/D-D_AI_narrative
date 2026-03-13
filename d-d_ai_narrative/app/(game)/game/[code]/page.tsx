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
    select: {
      id:     true,
      status: true,
      campaign: {
        select: { id: true, title: true, theme: true, difficulty: true },
      },
      gameState: {
        select: { id: true, currentTurn: true, narrativeContext: true },
      },
      players: {
        include: {
          user:      { select: { id: true, username: true } },
          character: {
            select: {
              name: true, class: true,
              maxHp: true, currentHp: true, armorClass: true,
            },
          },
        },
      },
    },
  });

  if (!room || room.status !== 'IN_PROGRESS') redirect('/lobby');
  if (!room.campaign || !room.gameState) redirect('/lobby');

  const playerEntry = room.players.find((p) => p.user.id === session.user.id);
  if (!playerEntry) redirect('/lobby');

  const isFirstTurn = room.gameState.currentTurn === 1 && !room.gameState.narrativeContext;

  return (
    <GameView
      roomCode={roomCode}
      campaign={{
        title:      room.campaign.title,
        theme:      room.campaign.theme as string,
        difficulty: room.campaign.difficulty as string,
      }}
      currentPlayer={{
        userId:         session.user.id,
        username:       playerEntry.user.username,
        characterName:  playerEntry.character?.name,
        characterClass: playerEntry.character?.class as string | undefined,
        maxHp:          playerEntry.character?.maxHp ?? undefined,
        currentHp:      playerEntry.character?.currentHp ?? undefined,
        armorClass:     playerEntry.character?.armorClass ?? undefined,
      }}
      isFirstTurn={isFirstTurn}
    />
  );
}
