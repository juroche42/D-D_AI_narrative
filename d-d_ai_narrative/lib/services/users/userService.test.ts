import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
    },
  },
}));

import { notFound } from '@/lib/api/errors';
import { prisma } from '@/lib/prisma';
import { getUserMe } from './userService';

describe('getUserMe', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('retourne le compte + profil pour un utilisateur existant', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: 'user_1',
      username: 'thorin',
      password: 'hash',
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedAt: new Date('2026-01-02T00:00:00.000Z'),
      profile: {
        id: 'profile_1',
        userId: 'user_1',
        avatarUrl: '',
        bio: 'Nain guerrier',
        language: 'FR',
        darkMode: true,
        totalGames: 12,
        totalTurns: 340,
        monstersDefeated: 40,
        naturalCrits: 7,
        updatedAt: new Date('2026-01-03T00:00:00.000Z'),
      },
    } as never);

    const result = await getUserMe('user_1');

    expect(prisma.user.findUnique).toHaveBeenCalledWith({
      where: { id: 'user_1' },
      include: { profile: true },
    });
    expect(result).toMatchObject({
      id: 'user_1',
      username: 'thorin',
      profile: {
        language: 'FR',
        totalGames: 12,
      },
    });
  });

  it('lève 404 si utilisateur absent', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

    await expect(getUserMe('missing')).rejects.toMatchObject(notFound('User'));
  });

  it('lève 404 si le profil est absent', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: 'user_1',
      username: 'thorin',
      password: 'hash',
      createdAt: new Date(),
      updatedAt: new Date(),
      profile: null,
    } as never);

    await expect(getUserMe('user_1')).rejects.toMatchObject(notFound('User'));
  });
});
