import 'server-only';
import { prisma } from '@/lib/prisma';
import { RoomStatus } from '@/app/generated/prisma/enums';
import { broadcastToRoom } from './sseManager';
import type { SSEEvent, SSEPlayer } from './sseManager';

export async function getRoomData(roomCode: string): Promise<{
  players: SSEPlayer[];
  status: RoomStatus;
}> {
  const room = await prisma.room.findUnique({
    where: { code: roomCode.toUpperCase() },
    include: {
      players: {
        include: {
          user: { select: { id: true, username: true } },
          character: { select: { name: true, race: true, class: true } },
        },
        orderBy: { joinedAt: 'asc' },
      },
    },
  });

  if (!room) return { players: [], status: RoomStatus.WAITING };

  const players: SSEPlayer[] = room.players.map((rp) => ({
    userId: rp.user.id,
    username: rp.user.username,
    characterId: rp.characterId,
    character: rp.character
      ? { name: rp.character.name, race: rp.character.race, class: rp.character.class }
      : null,
    isReady: rp.isReady,
    isHost: rp.userId === room.hostId,
    joinedAt: rp.joinedAt,
  }));

  return { players, status: room.status };
}

export async function getRoomPlayers(roomCode: string): Promise<SSEPlayer[]> {
  const { players } = await getRoomData(roomCode);
  return players;
}

export async function broadcastPlayerUpdate(
  roomCode: string,
  type: SSEEvent['type'] = 'player_joined',
): Promise<void> {
  const { players, status } = await getRoomData(roomCode);
  broadcastToRoom(roomCode, { type, roomCode, players, status, timestamp: Date.now() });
}
