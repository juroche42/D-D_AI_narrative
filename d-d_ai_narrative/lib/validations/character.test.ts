import { describe, it, expect } from 'vitest';
import { CreateCharacterSchema } from './character';

const VALID_CHARACTER = {
  name: 'Thorin Rochefer',
  race: 'Dwarf',
  class: 'Fighter',
  stats: {
    strength: 18,
    dexterity: 12,
    constitution: 16,
    intelligence: 10,
    wisdom: 9,
    charisma: 8,
  },
};

describe('CreateCharacterSchema', () => {
  it('personnage valide passe', () => {
    const result = CreateCharacterSchema.safeParse(VALID_CHARACTER);
    expect(result.success).toBe(true);
  });

  it('backstory optionnelle — absent → valide', () => {
    const result = CreateCharacterSchema.safeParse(VALID_CHARACTER);
    expect(result.success).toBe(true);
  });

  it('backstory présente → valide', () => {
    const result = CreateCharacterSchema.safeParse({
      ...VALID_CHARACTER,
      backstory: 'Un ancien forgeron des montagnes du Nord.',
    });
    expect(result.success).toBe(true);
  });

  it('name trop court (< 2) → erreur', () => {
    const result = CreateCharacterSchema.safeParse({ ...VALID_CHARACTER, name: 'X' });
    expect(result.success).toBe(false);
  });

  it('name trop long (> 30) → erreur', () => {
    const result = CreateCharacterSchema.safeParse({ ...VALID_CHARACTER, name: 'A'.repeat(31) });
    expect(result.success).toBe(false);
  });

  it('race invalide → erreur', () => {
    const result = CreateCharacterSchema.safeParse({ ...VALID_CHARACTER, race: 'Vampire' });
    expect(result.success).toBe(false);
  });

  it('class invalide → erreur', () => {
    const result = CreateCharacterSchema.safeParse({ ...VALID_CHARACTER, class: 'Necromancer' });
    expect(result.success).toBe(false);
  });

  it('stat < 1 → erreur', () => {
    const result = CreateCharacterSchema.safeParse({
      ...VALID_CHARACTER,
      stats: { ...VALID_CHARACTER.stats, strength: 0 },
    });
    expect(result.success).toBe(false);
  });

  it('stat > 20 → erreur', () => {
    const result = CreateCharacterSchema.safeParse({
      ...VALID_CHARACTER,
      stats: { ...VALID_CHARACTER.stats, charisma: 21 },
    });
    expect(result.success).toBe(false);
  });

  it('stat manquante → erreur', () => {
    const { charisma: _, ...statsWithout } = VALID_CHARACTER.stats;
    const result = CreateCharacterSchema.safeParse({ ...VALID_CHARACTER, stats: statsWithout });
    expect(result.success).toBe(false);
  });
});
