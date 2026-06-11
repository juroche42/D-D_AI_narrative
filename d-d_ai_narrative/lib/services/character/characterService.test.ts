import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    character: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
  },
}));

vi.mock('server-only', () => ({}));

import { createCharacter } from './characterService';
import { prisma } from '@/lib/prisma';

const VALID_DATA = {
  name: 'Thorin',
  race: 'DWARF' as const,
  class: 'FIGHTER' as const,
  stats: {
    strength: 16,
    dexterity: 12,
    constitution: 14,
    intelligence: 10,
    wisdom: 10,
    charisma: 8,
  },
};

const MOCK_CHARACTER = {
  id: 'char_cuid_1',
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
  userId: 'user_cuid_1',
  name: 'Thorin',
  race: 'DWARF',
  class: 'FIGHTER',
  strength: 16,
  dexterity: 12,
  constitution: 14,
  intelligence: 10,
  wisdom: 10,
  charisma: 8,
  maxHp: 12,
  currentHp: 12,
  armorClass: 11,
  xp: 0,
  level: 1,
};

describe('createCharacter', () => {
  beforeEach(() => vi.clearAllMocks());

  it('crée un personnage et retourne les données', async () => {
    vi.mocked(prisma.character.findUnique).mockResolvedValue(null);
    vi.mocked(prisma.character.create).mockResolvedValue(MOCK_CHARACTER as never);

    const result = await createCharacter('user_cuid_1', VALID_DATA);

    expect(prisma.character.create).toHaveBeenCalledOnce();
    expect(result.name).toBe('Thorin');
    expect(result.race).toBe('DWARF');
    expect(result.class).toBe('FIGHTER');
  });

  it('vérifie l\'unicité du nom avant la création', async () => {
    vi.mocked(prisma.character.findUnique).mockResolvedValue(null);
    vi.mocked(prisma.character.create).mockResolvedValue(MOCK_CHARACTER as never);

    await createCharacter('user_cuid_1', VALID_DATA);

    expect(prisma.character.findUnique).toHaveBeenCalledWith({
      where: { userId_name: { userId: 'user_cuid_1', name: 'Thorin' } },
    });
  });

  it('lève AppError 409 si le nom existe déjà pour cet utilisateur', async () => {
    vi.mocked(prisma.character.findUnique).mockResolvedValue(MOCK_CHARACTER as never);

    await expect(createCharacter('user_cuid_1', VALID_DATA)).rejects.toMatchObject({
      statusCode: 409,
      code: 'CONFLICT',
    });

    expect(prisma.character.create).not.toHaveBeenCalled();
  });

  it('calcule maxHp correctement pour un FIGHTER — CON 14 → +2 → 10+2=12', async () => {
    vi.mocked(prisma.character.findUnique).mockResolvedValue(null);
    vi.mocked(prisma.character.create).mockResolvedValue(MOCK_CHARACTER as never);

    await createCharacter('user_cuid_1', VALID_DATA);

    expect(prisma.character.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ maxHp: 12, currentHp: 12 }),
      }),
    );
  });

  it('calcule maxHp correctement pour un MAGE — CON 14 → +2 → 6+2=8', async () => {
    const mageData = { ...VALID_DATA, class: 'MAGE' as const };
    const mageMock = { ...MOCK_CHARACTER, class: 'MAGE', maxHp: 8, currentHp: 8 };

    vi.mocked(prisma.character.findUnique).mockResolvedValue(null);
    vi.mocked(prisma.character.create).mockResolvedValue(mageMock as never);

    await createCharacter('user_cuid_1', mageData);

    expect(prisma.character.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ maxHp: 8, currentHp: 8 }),
      }),
    );
  });

  it('calcule maxHp correctement pour un RANGER — CON 14 → +2 → 10+2=12', async () => {
    const rangerData = { ...VALID_DATA, class: 'RANGER' as const };

    vi.mocked(prisma.character.findUnique).mockResolvedValue(null);
    vi.mocked(prisma.character.create).mockResolvedValue(MOCK_CHARACTER as never);

    await createCharacter('user_cuid_1', rangerData);

    expect(prisma.character.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ maxHp: 12 }),
      }),
    );
  });

  it('calcule armorClass correctement — DEX 12 → +1 → 10+1=11', async () => {
    vi.mocked(prisma.character.findUnique).mockResolvedValue(null);
    vi.mocked(prisma.character.create).mockResolvedValue(MOCK_CHARACTER as never);

    await createCharacter('user_cuid_1', VALID_DATA);

    expect(prisma.character.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ armorClass: 11 }),
      }),
    );
  });

  it('armorClass avec DEX 10 → modificateur 0 → AC=10', async () => {
    const data = { ...VALID_DATA, stats: { ...VALID_DATA.stats, dexterity: 10 } };
    const mock = { ...MOCK_CHARACTER, armorClass: 10 };

    vi.mocked(prisma.character.findUnique).mockResolvedValue(null);
    vi.mocked(prisma.character.create).mockResolvedValue(mock as never);

    await createCharacter('user_cuid_1', data);

    expect(prisma.character.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ armorClass: 10 }),
      }),
    );
  });

  it('passe toutes les stats au create', async () => {
    vi.mocked(prisma.character.findUnique).mockResolvedValue(null);
    vi.mocked(prisma.character.create).mockResolvedValue(MOCK_CHARACTER as never);

    await createCharacter('user_cuid_1', VALID_DATA);

    expect(prisma.character.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          strength: 16,
          dexterity: 12,
          constitution: 14,
          intelligence: 10,
          wisdom: 10,
          charisma: 8,
        }),
      }),
    );
  });

  it('initialise xp=0 et level=1 à la création', async () => {
    vi.mocked(prisma.character.findUnique).mockResolvedValue(null);
    vi.mocked(prisma.character.create).mockResolvedValue(MOCK_CHARACTER as never);

    await createCharacter('user_cuid_1', VALID_DATA);

    expect(prisma.character.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ xp: 0, level: 1 }),
      }),
    );
  });
});
