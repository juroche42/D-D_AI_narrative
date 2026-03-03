import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RoomStatus, ActionMode } from '@/app/generated/prisma/enums';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    roomPlayer: {
      findFirst: vi.fn(),
      create: vi.fn(),
    },
    room: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

vi.mock('nanoid', () => ({
  customAlphabet: () => vi.fn().mockReturnValue('ABC123'),
}));

vi.mock('server-only', () => ({}));

import { createRoom, getRoomByCode } from './roomService';
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
    expect(result.inviteLink).toBe('http://localhost:3000/lobby/ABC123');
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
