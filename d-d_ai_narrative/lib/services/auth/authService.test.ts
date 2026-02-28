import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
  },
}));

vi.mock('bcrypt');

import { registerUser } from './authService';
import bcrypt from 'bcrypt';
import { prisma } from '@/lib/prisma';

describe('registerUser', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Cas nominal', () => {
    it('retourne un UserPublic sans le champ password', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue(null);
      vi.mocked(bcrypt.hash).mockResolvedValue('hashed_password' as never);
      vi.mocked(prisma.user.create).mockResolvedValue({
        id: 'cuid_123',
        username: 'TestHero',
        password: 'hashed_password',
        createdAt: new Date('2026-01-01'),
        updatedAt: new Date('2026-01-01'),
      });

      const result = await registerUser({ username: 'TestHero', password: 'Password1' });

      expect(result).toEqual({
        id: 'cuid_123',
        username: 'TestHero',
        createdAt: new Date('2026-01-01'),
      });
      expect(result).not.toHaveProperty('password');
    });

    it("l'objet retourné contient exactement id, username, createdAt", async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue(null);
      vi.mocked(bcrypt.hash).mockResolvedValue('hash' as never);
      vi.mocked(prisma.user.create).mockResolvedValue({
        id: 'abc',
        username: 'Hero',
        password: 'hash',
        createdAt: new Date('2026-01-01'),
        updatedAt: new Date('2026-01-01'),
      });

      const result = await registerUser({ username: 'Hero', password: 'Password1' });

      expect(Object.keys(result)).toEqual(['id', 'username', 'createdAt']);
    });
  });

  describe("Cas d'erreur", () => {
    it('lève une AppError 409 si le username est déjà pris', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        id: 'existing',
        username: 'TestHero',
        password: 'hash',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await expect(
        registerUser({ username: 'TestHero', password: 'Password1' }),
      ).rejects.toMatchObject({ statusCode: 409, code: 'CONFLICT' });
    });

    it("ne crée pas l'utilisateur si le username existe déjà", async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        id: 'x',
        username: 'TestHero',
        password: 'h',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await expect(registerUser({ username: 'TestHero', password: 'Password1' })).rejects.toThrow();

      expect(prisma.user.create).not.toHaveBeenCalled();
    });
  });

  describe('Sécurité', () => {
    it('appelle bcrypt.hash avec salt rounds 12', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue(null);
      vi.mocked(bcrypt.hash).mockResolvedValue('hashed' as never);
      vi.mocked(prisma.user.create).mockResolvedValue({
        id: '1',
        username: 'H',
        password: 'hashed',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await registerUser({ username: 'Hero', password: 'Password1' });

      expect(bcrypt.hash).toHaveBeenCalledWith('Password1', 12);
    });

    it('ne stocke pas le mot de passe en clair', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue(null);
      vi.mocked(bcrypt.hash).mockResolvedValue('$2b$12$fakehash' as never);
      vi.mocked(prisma.user.create).mockResolvedValue({
        id: '1',
        username: 'H',
        password: '$2b$12$fakehash',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await registerUser({ username: 'Hero', password: 'Password1' });

      const createCall = vi.mocked(prisma.user.create).mock.calls[0][0];
      expect(createCall.data.password).not.toBe('Password1');
      expect(createCall.data.password).toMatch(/^\$2b\$/);
    });

    it('deux hashages du même mot de passe donnent des hashes différents (bcrypt réel)', async () => {
      const realBcrypt = await vi.importActual<typeof import('bcrypt')>('bcrypt');
      const hash1 = await realBcrypt.hash('Password1', 12);
      const hash2 = await realBcrypt.hash('Password1', 12);
      expect(hash1).not.toBe(hash2);
    });
  });
});
