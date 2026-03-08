import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RoomStatus, ActionMode } from '@/app/generated/prisma/enums';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    roomPlayer: {
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      delete: vi.fn(),
    },
    room: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

vi.mock('nanoid', () => ({
  customAlphabet: () => vi.fn().mockReturnValue('ABC123'),
}));

vi.mock('server-only', () => ({}));

vi.mock('@/lib/sse/sseService', () => ({
  broadcastPlayerUpdate: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('@/lib/sse/sseManager', () => ({
  broadcastToRoom: vi.fn(),
}));

import { createRoom, getRoomByCode, joinRoom, leaveRoom } from './roomService';
import { prisma } from '@/lib/prisma';

const MOCK_ROOM = {
  id: 'room_cuid_1',
  code: 'ABC123',
  name: 'Salon de ThorinHero',
  status: RoomStatus.WAITING,
  maxPlayers: 6,
  hostId: 'user_cuid_1',
  createdAt: new Date('2026-03-03'),
  updatedAt: new Date('2026-03-03'),
  actionMode: ActionMode.VOTE,
};

describe('createRoom', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.NEXTAUTH_URL = 'http://localhost:3000';

    vi.mocked(prisma.$transaction).mockImplementation(async (fn) => {
      return fn({
        room: { create: vi.fn().mockResolvedValue(MOCK_ROOM) },
        roomPlayer: { create: vi.fn().mockResolvedValue({}) },
      } as never);
    });
  });

  it('retourne un RoomPublic avec inviteLink et code [A-Z0-9]{6}', async () => {
    vi.mocked(prisma.roomPlayer.findFirst).mockResolvedValue(null);
    vi.mocked(prisma.room.findUnique).mockResolvedValue(null);

    const result = await createRoom('user_cuid_1', 'ThorinHero');

    expect(result).toMatchObject({
      id: 'room_cuid_1',
      code: 'ABC123',
      name: 'Salon de ThorinHero',
      status: 'WAITING',
      maxPlayers: 6,
      hostId: 'user_cuid_1',
    });
    expect(result.inviteLink).toBe('http://localhost:3000/room/ABC123');
    expect(result.code).toMatch(/^[A-Z0-9]{6}$/);
  });

  it('lève AppError 409 si déjà dans un salon WAITING', async () => {
    vi.mocked(prisma.roomPlayer.findFirst).mockResolvedValue({
      id: 'rp_1',
      roomId: 'room_1',
      userId: 'user_cuid_1',
      characterId: null,
      isReady: false,
      joinedAt: new Date(),
    });

    await expect(createRoom('user_cuid_1', 'ThorinHero')).rejects.toMatchObject({
      statusCode: 409,
      code: 'CONFLICT',
    });
  });

  it('throw si code non unique après 5 tentatives', async () => {
    vi.mocked(prisma.roomPlayer.findFirst).mockResolvedValue(null);
    vi.mocked(prisma.room.findUnique).mockResolvedValue(MOCK_ROOM);

    await expect(createRoom('user_cuid_1', 'ThorinHero')).rejects.toThrow(
      'Impossible de générer un code unique après plusieurs tentatives',
    );
  });
});

describe('getRoomByCode', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.NEXTAUTH_URL = 'http://localhost:3000';
  });

  it('normalise le code en majuscules avant la requête', async () => {
    vi.mocked(prisma.room.findUnique).mockResolvedValue(MOCK_ROOM);

    await getRoomByCode('abc123');

    expect(prisma.room.findUnique).toHaveBeenCalledWith({
      where: { code: 'ABC123' },
    });
  });

  it('lève AppError 404 si code inconnu', async () => {
    vi.mocked(prisma.room.findUnique).mockResolvedValue(null);

    await expect(getRoomByCode('XXXXXX')).rejects.toMatchObject({
      statusCode: 404,
      code: 'NOT_FOUND',
    });
  });
});

describe('joinRoom', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.NEXTAUTH_URL = 'http://localhost:3000';
  });

  const mockRoomWithCount = {
    ...MOCK_ROOM,
    _count: { players: 1 },
  };

  it('ajoute le joueur et retourne RoomPublic', async () => {
    vi.mocked(prisma.room.findUnique).mockResolvedValue(mockRoomWithCount as never);
    vi.mocked(prisma.roomPlayer.findUnique).mockResolvedValue(null);
    vi.mocked(prisma.roomPlayer.findFirst).mockResolvedValue(null);
    vi.mocked(prisma.roomPlayer.create).mockResolvedValue({} as never);

    const result = await joinRoom('ABC123', 'user_2');

    expect(result.code).toBe('ABC123');
    expect(prisma.roomPlayer.create).toHaveBeenCalledOnce();
  });

  it('est idempotent si le joueur est déjà dans ce salon', async () => {
    vi.mocked(prisma.room.findUnique).mockResolvedValue(mockRoomWithCount as never);
    vi.mocked(prisma.roomPlayer.findUnique).mockResolvedValue({ id: 'rp_existing' } as never);

    const result = await joinRoom('ABC123', 'user_1');

    expect(result.code).toBe('ABC123');
    expect(prisma.roomPlayer.create).not.toHaveBeenCalled();
  });

  it('lève 404 si le code est inconnu', async () => {
    vi.mocked(prisma.room.findUnique).mockResolvedValue(null);

    await expect(joinRoom('XXXXXX', 'user_2')).rejects.toMatchObject({ statusCode: 404 });
  });

  it("lève 410 si le salon n'est plus en WAITING", async () => {
    vi.mocked(prisma.room.findUnique).mockResolvedValue({
      ...MOCK_ROOM,
      status: 'IN_PROGRESS',
      _count: { players: 2 },
    } as never);

    await expect(joinRoom('ABC123', 'user_2')).rejects.toMatchObject({ statusCode: 410 });
  });

  it('lève 422 si le salon est plein', async () => {
    vi.mocked(prisma.room.findUnique).mockResolvedValue({
      ...MOCK_ROOM,
      maxPlayers: 2,
      _count: { players: 2 },
    } as never);

    await expect(joinRoom('ABC123', 'user_2')).rejects.toMatchObject({ statusCode: 422 });
  });

  it('lève 409 si le joueur est dans un autre salon actif', async () => {
    vi.mocked(prisma.room.findUnique).mockResolvedValue(mockRoomWithCount as never);
    vi.mocked(prisma.roomPlayer.findUnique).mockResolvedValue(null);
    vi.mocked(prisma.roomPlayer.findFirst).mockResolvedValue({ id: 'rp_other' } as never);

    await expect(joinRoom('ABC123', 'user_2')).rejects.toMatchObject({ statusCode: 409 });
  });

  it('normalise le code en uppercase', async () => {
    vi.mocked(prisma.room.findUnique).mockResolvedValue(mockRoomWithCount as never);
    vi.mocked(prisma.roomPlayer.findUnique).mockResolvedValue(null);
    vi.mocked(prisma.roomPlayer.findFirst).mockResolvedValue(null);
    vi.mocked(prisma.roomPlayer.create).mockResolvedValue({} as never);

    await joinRoom('abc123', 'user_2');

    expect(prisma.room.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({ where: { code: 'ABC123' } }),
    );
  });
});

const MOCK_PLAYERS = [
  { id: 'rp_1', userId: 'user_cuid_1', joinedAt: new Date('2026-03-03T10:00:00'), roomId: 'room_cuid_1' },
  { id: 'rp_2', userId: 'user_2', joinedAt: new Date('2026-03-03T10:01:00'), roomId: 'room_cuid_1' },
];

describe('leaveRoom', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.NEXTAUTH_URL = 'http://localhost:3000';
  });

  it('host seul → supprime le salon et broadcast room_closed', async () => {
    vi.mocked(prisma.room.findUnique).mockResolvedValue({
      ...MOCK_ROOM, players: [MOCK_PLAYERS[0]],
    } as never);
    vi.mocked(prisma.room.delete).mockResolvedValue(MOCK_ROOM as never);

    await leaveRoom('ABC123', 'user_cuid_1');

    expect(prisma.room.delete).toHaveBeenCalledWith({ where: { id: 'room_cuid_1' } });
  });

  it('host avec autres → transfère le host et supprime son entry', async () => {
    vi.mocked(prisma.room.findUnique).mockResolvedValue({
      ...MOCK_ROOM, players: MOCK_PLAYERS,
    } as never);
    vi.mocked(prisma.$transaction).mockResolvedValue([] as never);

    await leaveRoom('ABC123', 'user_cuid_1');

    expect(prisma.$transaction).toHaveBeenCalled();
  });

  it('joueur normal → supprime son entry et broadcast player_left', async () => {
    vi.mocked(prisma.room.findUnique).mockResolvedValue({
      ...MOCK_ROOM, players: MOCK_PLAYERS,
    } as never);
    vi.mocked(prisma.roomPlayer.delete).mockResolvedValue({} as never);

    await leaveRoom('ABC123', 'user_2');

    expect(prisma.roomPlayer.delete).toHaveBeenCalledWith({ where: { id: 'rp_2' } });
  });

  it('lève 404 si le salon est inconnu', async () => {
    vi.mocked(prisma.room.findUnique).mockResolvedValue(null);

    await expect(leaveRoom('XXXXXX', 'user_cuid_1')).rejects.toMatchObject({ statusCode: 404 });
  });

  it("lève 404 si le joueur n'est pas membre", async () => {
    vi.mocked(prisma.room.findUnique).mockResolvedValue({
      ...MOCK_ROOM, players: [MOCK_PLAYERS[0]],
    } as never);

    await expect(leaveRoom('ABC123', 'stranger')).rejects.toMatchObject({ statusCode: 404 });
  });
});
