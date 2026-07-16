import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RoomStatus } from '@/app/generated/prisma/enums';

vi.mock('server-only', () => ({}));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    room: {
      findUnique: vi.fn(),
    },
  },
}));

vi.mock('./sseManager', () => ({
  broadcastToRoom: vi.fn(),
}));

import { getRoomData, getRoomPlayers, broadcastPlayerUpdate } from './sseService';
import { prisma } from '@/lib/prisma';
import { broadcastToRoom } from './sseManager';

const HOST_PLAYER = {
  userId: 'user_host',
  characterId: 'char_1',
  isReady: false,
  joinedAt: new Date('2026-03-03T10:00:00'),
  user: { id: 'user_host', username: 'Thorin' },
  character: { name: 'Grommash', race: 'HALF_ORC', class: 'FIGHTER' },
};

const GUEST_PLAYER = {
  userId: 'user_guest',
  characterId: null,
  isReady: true,
  joinedAt: new Date('2026-03-03T10:01:00'),
  user: { id: 'user_guest', username: 'Legolas' },
  character: null,
};

const MOCK_ROOM = {
  code: 'ABC123',
  hostId: 'user_host',
  status: RoomStatus.WAITING,
  players: [HOST_PLAYER, GUEST_PLAYER],
};

describe('getRoomData', () => {
  beforeEach(() => vi.clearAllMocks());

  it('normalise le code en majuscules et inclut la relation character', async () => {
    vi.mocked(prisma.room.findUnique).mockResolvedValue(MOCK_ROOM as never);

    await getRoomData('abc123');

    expect(prisma.room.findUnique).toHaveBeenCalledWith({
      where: { code: 'ABC123' },
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
  });

  it('sérialise le résumé du personnage (nom, race, classe) quand présent', async () => {
    vi.mocked(prisma.room.findUnique).mockResolvedValue(MOCK_ROOM as never);

    const { players } = await getRoomData('ABC123');

    expect(players[0]).toMatchObject({
      userId: 'user_host',
      username: 'Thorin',
      characterId: 'char_1',
      character: { name: 'Grommash', race: 'HALF_ORC', class: 'FIGHTER' },
      isHost: true,
    });
  });

  it('sérialise character = null pour un joueur sans personnage', async () => {
    vi.mocked(prisma.room.findUnique).mockResolvedValue(MOCK_ROOM as never);

    const { players } = await getRoomData('ABC123');

    expect(players[1]).toMatchObject({
      userId: 'user_guest',
      characterId: null,
      character: null,
      isHost: false,
    });
  });

  it('calcule isHost en comparant userId et hostId', async () => {
    vi.mocked(prisma.room.findUnique).mockResolvedValue(MOCK_ROOM as never);

    const { players } = await getRoomData('ABC123');

    expect(players.find((p) => p.userId === 'user_host')?.isHost).toBe(true);
    expect(players.find((p) => p.userId === 'user_guest')?.isHost).toBe(false);
  });

  it('retourne une liste vide et le statut WAITING si le salon est introuvable', async () => {
    vi.mocked(prisma.room.findUnique).mockResolvedValue(null);

    const result = await getRoomData('XXXXXX');

    expect(result).toEqual({ players: [], status: RoomStatus.WAITING });
  });
});

describe('getRoomPlayers', () => {
  beforeEach(() => vi.clearAllMocks());

  it('retourne uniquement le tableau de joueurs', async () => {
    vi.mocked(prisma.room.findUnique).mockResolvedValue(MOCK_ROOM as never);

    const players = await getRoomPlayers('ABC123');

    expect(players).toHaveLength(2);
    expect(players[0].character).toEqual({ name: 'Grommash', race: 'HALF_ORC', class: 'FIGHTER' });
  });
});

describe('broadcastPlayerUpdate', () => {
  beforeEach(() => vi.clearAllMocks());

  it('diffuse les joueurs (avec résumé personnage) et le statut au salon', async () => {
    vi.mocked(prisma.room.findUnique).mockResolvedValue(MOCK_ROOM as never);

    await broadcastPlayerUpdate('ABC123', 'player_updated');

    expect(broadcastToRoom).toHaveBeenCalledWith(
      'ABC123',
      expect.objectContaining({
        type: 'player_updated',
        roomCode: 'ABC123',
        status: RoomStatus.WAITING,
        players: expect.arrayContaining([
          expect.objectContaining({
            character: { name: 'Grommash', race: 'HALF_ORC', class: 'FIGHTER' },
          }),
        ]),
      }),
    );
  });

  it('utilise player_joined comme type par défaut', async () => {
    vi.mocked(prisma.room.findUnique).mockResolvedValue(MOCK_ROOM as never);

    await broadcastPlayerUpdate('ABC123');

    expect(broadcastToRoom).toHaveBeenCalledWith(
      'ABC123',
      expect.objectContaining({ type: 'player_joined' }),
    );
  });
});
