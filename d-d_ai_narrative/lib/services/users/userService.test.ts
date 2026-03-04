import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    $queryRaw: vi.fn(),
    $executeRaw: vi.fn(),
  },
}));

vi.mock('bcrypt');

import { notFound } from '@/lib/api/errors';
import bcrypt from 'bcrypt';
import { prisma } from '@/lib/prisma';
import { getUserMe, updateUserMe } from './userService';

describe('getUserMe', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('retourne le compte + profil pour un utilisateur existant', async () => {
    vi.mocked(prisma.$queryRaw).mockResolvedValueOnce([
      {
        id: 'user_1',
        username: 'thorin',
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
        updatedAt: new Date('2026-01-02T00:00:00.000Z'),
        profileId: 'profile_1',
        avatarUrl: '',
        bio: 'Nain guerrier',
        language: 'FR',
        darkMode: true,
        totalGames: 12,
        totalTurns: 340,
        monstersDefeated: 40,
        naturalCrits: 7,
        profileUpdatedAt: new Date('2026-01-03T00:00:00.000Z'),
      },
    ]);

    const result = await getUserMe('user_1');

    expect(prisma.$queryRaw).toHaveBeenCalledOnce();
    expect(result).toMatchObject({
      id: 'user_1',
      username: 'thorin',
      profile: {
        language: 'FR',
        totalGames: 12,
      },
    });
  });

  it('404 si utilisateur absent', async () => {
    vi.mocked(prisma.$queryRaw).mockResolvedValueOnce([]);

    await expect(getUserMe('missing')).rejects.toMatchObject(notFound('User'));
  });

  it('404 si le profil est absent', async () => {
    vi.mocked(prisma.$queryRaw).mockResolvedValueOnce([
      {
        id: 'user_1',
        username: 'thorin',
        createdAt: new Date(),
        updatedAt: new Date(),
        profileId: null,
        avatarUrl: null,
        bio: null,
        language: null,
        darkMode: null,
        totalGames: null,
        totalTurns: null,
        monstersDefeated: null,
        naturalCrits: null,
        profileUpdatedAt: null,
      },
    ]);

    await expect(getUserMe('user_1')).rejects.toMatchObject(notFound('User'));
  });
});

describe('updateUserMe', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('met à jour le pseudo puis retourne le profil mis à jour', async () => {
    vi.mocked(prisma.$queryRaw)
      .mockResolvedValueOnce([{ id: 'user_1', username: 'old', password: 'hash' }])
      .mockResolvedValueOnce([{ userId: 'user_1' }])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([
        {
          id: 'user_1',
          username: 'new_name',
          createdAt: new Date('2026-01-01T00:00:00.000Z'),
          updatedAt: new Date('2026-01-04T00:00:00.000Z'),
          profileId: 'profile_1',
          avatarUrl: '',
          bio: '',
          language: 'FR',
          darkMode: false,
          totalGames: 0,
          totalTurns: 0,
          monstersDefeated: 0,
          naturalCrits: 0,
          profileUpdatedAt: new Date('2026-01-04T00:00:00.000Z'),
        },
      ]);
    vi.mocked(prisma.$executeRaw).mockResolvedValue(1 as never);

    const result = await updateUserMe('user_1', { username: 'new_name' });

    expect(prisma.$executeRaw).toHaveBeenCalledOnce();
    expect(result.username).toBe('new_name');
  });

  it('409 si le pseudo est déjà pris', async () => {
    vi.mocked(prisma.$queryRaw)
      .mockResolvedValueOnce([{ id: 'user_1', username: 'old', password: 'hash' }])
      .mockResolvedValueOnce([{ userId: 'user_1' }])
      .mockResolvedValueOnce([{ id: 'taken_user' }]);

    await expect(updateUserMe('user_1', { username: 'taken' })).rejects.toMatchObject({
      statusCode: 409,
      code: 'CONFLICT',
    });
    expect(prisma.$executeRaw).not.toHaveBeenCalled();
  });

  it('401 si le mot de passe actuel est invalide', async () => {
    vi.mocked(prisma.$queryRaw)
      .mockResolvedValueOnce([{ id: 'user_1', username: 'old', password: 'hash' }])
      .mockResolvedValueOnce([{ userId: 'user_1' }]);
    vi.mocked(bcrypt.compare).mockResolvedValue(false as never);

    await expect(
      updateUserMe('user_1', {
        currentPassword: 'WrongPass1',
        newPassword: 'NewPassword1',
        confirmNewPassword: 'NewPassword1',
      }),
    ).rejects.toMatchObject({
      statusCode: 401,
      code: 'UNAUTHORIZED',
    });
    expect(prisma.$executeRaw).not.toHaveBeenCalled();
  });

  it('change le mot de passe si currentPassword est valide', async () => {
    vi.mocked(prisma.$queryRaw)
      .mockResolvedValueOnce([{ id: 'user_1', username: 'old', password: '$2b$oldhash' }])
      .mockResolvedValueOnce([{ userId: 'user_1' }])
      .mockResolvedValueOnce([
        {
          id: 'user_1',
          username: 'old',
          createdAt: new Date('2026-01-01T00:00:00.000Z'),
          updatedAt: new Date('2026-01-05T00:00:00.000Z'),
          profileId: 'profile_1',
          avatarUrl: '',
          bio: '',
          language: 'FR',
          darkMode: false,
          totalGames: 0,
          totalTurns: 0,
          monstersDefeated: 0,
          naturalCrits: 0,
          profileUpdatedAt: new Date('2026-01-05T00:00:00.000Z'),
        },
      ]);
    vi.mocked(bcrypt.compare).mockResolvedValue(true as never);
    vi.mocked(bcrypt.hash).mockResolvedValue('$2b$newhash' as never);
    vi.mocked(prisma.$executeRaw).mockResolvedValue(1 as never);

    const result = await updateUserMe('user_1', {
      currentPassword: 'OldPassword1',
      newPassword: 'NewPassword1',
      confirmNewPassword: 'NewPassword1',
    });

    expect(bcrypt.compare).toHaveBeenCalledWith('OldPassword1', '$2b$oldhash');
    expect(bcrypt.hash).toHaveBeenCalledWith('NewPassword1', 12);
    expect(prisma.$executeRaw).toHaveBeenCalledOnce();
    expect(result.id).toBe('user_1');
  });

  it('404 si utilisateur absent', async () => {
    vi.mocked(prisma.$queryRaw).mockResolvedValueOnce([]);

    await expect(updateUserMe('missing', { username: 'hero' })).rejects.toMatchObject(notFound('User'));
  });
});
