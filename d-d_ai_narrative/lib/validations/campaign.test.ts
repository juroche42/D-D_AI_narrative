import { describe, it, expect } from 'vitest';
import { CampaignFiltersSchema, CreateCampaignSchema } from './campaign';

describe('CampaignFiltersSchema', () => {
  it('accepte un objet vide et applique les défauts', () => {
    const result = CampaignFiltersSchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.page).toBe(1);
      expect(result.data.limit).toBe(12);
    }
  });

  it('accepte un thème et une difficulté valides', () => {
    const result = CampaignFiltersSchema.safeParse({ theme: 'HEROIC', difficulty: 'EASY' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.theme).toBe('HEROIC');
      expect(result.data.difficulty).toBe('EASY');
    }
  });

  it('convertit isPremium "true" (string) en booléen true', () => {
    const result = CampaignFiltersSchema.safeParse({ isPremium: 'true' });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.isPremium).toBe(true);
  });

  it('convertit isPremium "false" (string) en booléen false', () => {
    const result = CampaignFiltersSchema.safeParse({ isPremium: 'false' });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.isPremium).toBe(false);
  });

  it('coerce page et limit depuis des strings', () => {
    const result = CampaignFiltersSchema.safeParse({ page: '3', limit: '24' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.page).toBe(3);
      expect(result.data.limit).toBe(24);
    }
  });

  it('rejette un thème invalide', () => {
    const result = CampaignFiltersSchema.safeParse({ theme: 'UNKNOWN' });
    expect(result.success).toBe(false);
  });

  it('rejette limit > 50', () => {
    const result = CampaignFiltersSchema.safeParse({ limit: '100' });
    expect(result.success).toBe(false);
  });
});

const validInput = {
  title:             'La Crypte du Roi',
  synopsis:          'Un synopsis suffisamment long pour passer la validation Zod.',
  startLocation:     'Phandalin',
  mainQuest:         'Retrouver la mine perdue avant que les gobelins ne la pillent.',
  theme:             'HEROIC' as const,
  difficulty:        'EASY' as const,
  minPlayers:        2,
  maxPlayers:        6,
  estimatedDuration: 120,
  isPublic:          false,
  isPremium:         false,
};

describe('CreateCampaignSchema', () => {
  it('accepte une entrée valide complète', () => {
    const result = CreateCampaignSchema.safeParse(validInput);
    expect(result.success).toBe(true);
  });

  it('applique les valeurs par défaut (minPlayers, maxPlayers, estimatedDuration)', () => {
    const { minPlayers: _, maxPlayers: __, estimatedDuration: ___, ...rest } = validInput;
    const result = CreateCampaignSchema.safeParse(rest);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.minPlayers).toBe(2);
      expect(result.data.maxPlayers).toBe(6);
      expect(result.data.estimatedDuration).toBe(120);
    }
  });

  it('rejette un titre trop court (< 3 caractères)', () => {
    const result = CreateCampaignSchema.safeParse({ ...validInput, title: 'AB' });
    expect(result.success).toBe(false);
  });

  it('rejette un synopsis trop court (< 20 caractères)', () => {
    const result = CreateCampaignSchema.safeParse({ ...validInput, synopsis: 'Trop court.' });
    expect(result.success).toBe(false);
  });

  it('rejette une quête trop courte (< 20 caractères)', () => {
    const result = CreateCampaignSchema.safeParse({ ...validInput, mainQuest: 'Trop courte.' });
    expect(result.success).toBe(false);
  });

  it('rejette un thème invalide', () => {
    const result = CreateCampaignSchema.safeParse({ ...validInput, theme: 'CHAOS' });
    expect(result.success).toBe(false);
  });

  it('rejette minPlayers > maxPlayers (refine)', () => {
    const result = CreateCampaignSchema.safeParse({ ...validInput, minPlayers: 5, maxPlayers: 2 });
    expect(result.success).toBe(false);
    if (!result.success) {
      const paths = result.error.issues.map((i) => i.path[0]);
      expect(paths).toContain('minPlayers');
    }
  });

  it('rejette isPremium=true + isPublic=false (refine)', () => {
    const result = CreateCampaignSchema.safeParse({ ...validInput, isPremium: true, isPublic: false });
    expect(result.success).toBe(false);
    if (!result.success) {
      const paths = result.error.issues.map((i) => i.path[0]);
      expect(paths).toContain('isPremium');
    }
  });

  it('accepte isPremium=true + isPublic=true', () => {
    const result = CreateCampaignSchema.safeParse({ ...validInput, isPremium: true, isPublic: true });
    expect(result.success).toBe(true);
  });

  it('coerce minPlayers et maxPlayers depuis des strings', () => {
    const result = CreateCampaignSchema.safeParse({ ...validInput, minPlayers: '2', maxPlayers: '4' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.minPlayers).toBe(2);
      expect(result.data.maxPlayers).toBe(4);
    }
  });
});
