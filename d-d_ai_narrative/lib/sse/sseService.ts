import 'server-only';
import { prisma } from '@/lib/prisma';
import { broadcastToRoom } from './sseManager';
import type { SSEEvent, SSEPlayer } from './sseManager';

export async function getRoomPlayers(roomCode: string): Promise<SSEPlayer[]> {
  const room = await prisma.room.findUnique({
    where: { code: roomCode.toUpperCase() },
    include: {
      players: {
        include: { user: { select: { id: true, username: true } } },
        orderBy: { joinedAt: 'asc' },
      },
    },
  });

  if (!room) return [];

  return room.players.map((rp) => ({
    userId: rp.user.id,
    username: rp.user.username,
    characterId: rp.characterId,
    isReady: rp.isReady,
    isHost: rp.userId === room.hostId,
    joinedAt: rp.joinedAt,
  }));
}

export async function broadcastPlayerUpdate(
  roomCode: string,
  type: SSEEvent['type'] = 'player_joined',
): Promise<void> {
  const players = await getRoomPlayers(roomCode);
  broadcastToRoom(roomCode, {
    type,
    roomCode,
    players,
    timestamp: Date.now(),
  });
}
