import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RoomStatus, ActionMode } from '@/app/generated/prisma/enums';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    roomPlayer: {
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      delete: vi.fn(),
      update: vi.fn(),
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

import { createRoom, getRoomByCode, joinRoom, leaveRoom, updateRoomStatus, togglePlayerReady } from './roomService';
import { prisma } from '@/lib/prisma';

const MOCK_ROOM = {
  id: 'room_cuid_1',
  code: 'ABC123',
  name: 'Salon de ThorinHero',
  status: RoomStatus.WAITING,
  maxPlayers: 6,
  hostId: 'user_cuid_1',
  campaignId: null,
  campaign: null,
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
      include: {
        campaign: { select: { id: true, title: true, theme: true, difficulty: true } },
      },
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

describe('updateRoomStatus', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.NEXTAUTH_URL = 'http://localhost:3000';
  });

  it('host peut passer WAITING → IN_PROGRESS avec ≥ 2 joueurs', async () => {
    vi.mocked(prisma.room.findUnique).mockResolvedValue({
      ...MOCK_ROOM, _count: { players: 3 },
    } as never);
    vi.mocked(prisma.room.update).mockResolvedValue({
      ...MOCK_ROOM, status: 'IN_PROGRESS',
    } as never);

    const result = await updateRoomStatus('ABC123', 'user_cuid_1', 'IN_PROGRESS');

    expect(result.status).toBe('IN_PROGRESS');
    expect(prisma.room.update).toHaveBeenCalledWith({
      where: { id: 'room_cuid_1' },
      data: { status: 'IN_PROGRESS' },
    });
  });

  it('lève 403 si un non-host tente de démarrer', async () => {
    vi.mocked(prisma.room.findUnique).mockResolvedValue({
      ...MOCK_ROOM, _count: { players: 3 },
    } as never);

    await expect(updateRoomStatus('ABC123', 'stranger', 'IN_PROGRESS'))
      .rejects.toMatchObject({ statusCode: 403 });
  });

  it('lève 422 si moins de 2 joueurs pour démarrer', async () => {
    vi.mocked(prisma.room.findUnique).mockResolvedValue({
      ...MOCK_ROOM, _count: { players: 1 },
    } as never);

    await expect(updateRoomStatus('ABC123', 'user_cuid_1', 'IN_PROGRESS'))
      .rejects.toMatchObject({ statusCode: 422 });
  });

  it('lève 409 pour une transition invalide (FINISHED → IN_PROGRESS)', async () => {
    vi.mocked(prisma.room.findUnique).mockResolvedValue({
      ...MOCK_ROOM, status: 'FINISHED', _count: { players: 3 },
    } as never);

    await expect(updateRoomStatus('ABC123', 'user_cuid_1', 'IN_PROGRESS'))
      .rejects.toMatchObject({ statusCode: 409 });
  });

  it('lève 404 si le salon est inconnu', async () => {
    vi.mocked(prisma.room.findUnique).mockResolvedValue(null);

    await expect(updateRoomStatus('XXXXXX', 'user_cuid_1', 'IN_PROGRESS'))
      .rejects.toMatchObject({ statusCode: 404 });
  });
});

const MOCK_PLAYER_NOT_HOST = {
  id: 'rp_2',
  userId: 'user_2',
  roomId: 'room_cuid_1',
  isReady: false,
  joinedAt: new Date(),
  characterId: null,
};

describe('togglePlayerReady', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('bascule isReady false → true pour un joueur non-host', async () => {
    vi.mocked(prisma.room.findUnique).mockResolvedValue({
      ...MOCK_ROOM,
      players: [MOCK_PLAYER_NOT_HOST],
    } as never);
    vi.mocked(prisma.roomPlayer.update).mockResolvedValue({
      ...MOCK_PLAYER_NOT_HOST, isReady: true,
    } as never);

    const result = await togglePlayerReady('ABC123', 'user_2');
    expect(result).toBe(true);
    expect(prisma.roomPlayer.update).toHaveBeenCalledWith({
      where: { id: 'rp_2' },
      data: { isReady: true },
    });
  });

  it('bascule isReady true → false (unready)', async () => {
    vi.mocked(prisma.room.findUnique).mockResolvedValue({
      ...MOCK_ROOM,
      players: [{ ...MOCK_PLAYER_NOT_HOST, isReady: true }],
    } as never);
    vi.mocked(prisma.roomPlayer.update).mockResolvedValue({
      ...MOCK_PLAYER_NOT_HOST, isReady: false,
    } as never);

    const result = await togglePlayerReady('ABC123', 'user_2');
    expect(result).toBe(false);
  });

  it('lève 403 si le host tente de se marquer prêt', async () => {
    vi.mocked(prisma.room.findUnique).mockResolvedValue({
      ...MOCK_ROOM,
      players: [{ id: 'rp_host', userId: 'user_cuid_1', isReady: false, roomId: 'room_cuid_1', joinedAt: new Date(), characterId: null }],
    } as never);

    await expect(togglePlayerReady('ABC123', 'user_cuid_1'))
      .rejects.toMatchObject({ statusCode: 403 });
  });

  it('lève 404 si le salon est inconnu', async () => {
    vi.mocked(prisma.room.findUnique).mockResolvedValue(null);

    await expect(togglePlayerReady('XXXXXX', 'user_2'))
      .rejects.toMatchObject({ statusCode: 404 });
  });

  it("lève 409 si le salon n'est pas en WAITING", async () => {
    vi.mocked(prisma.room.findUnique).mockResolvedValue({
      ...MOCK_ROOM, status: 'IN_PROGRESS',
      players: [MOCK_PLAYER_NOT_HOST],
    } as never);

    await expect(togglePlayerReady('ABC123', 'user_2'))
      .rejects.toMatchObject({ statusCode: 409 });
  });
});
