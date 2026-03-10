import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CampaignTheme, CampaignDifficulty } from '@/app/generated/prisma/enums';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    campaign: {
      findUnique: vi.fn(),
      findMany:   vi.fn(),
      count:      vi.fn(),
      create:     vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

vi.mock('@/lib/services/campaign/promptGenerator', () => ({
  generateSystemPrompt: vi.fn().mockResolvedValue('Mock system prompt généré par IA'),
}));

import { getPublicCampaigns, getCampaignById, validateCampaignVisibility, createCampaign } from './campaignService';
import { prisma } from '@/lib/prisma';
import { generateSystemPrompt } from './promptGenerator';

const mockCampaign = {
  id: 'campaign_1',
  title: 'La Mine Perdue de Phandelver',
  synopsis: 'Un village menacé...',
  startLocation: 'Phandalin',
  mainQuest: 'Retrouver la mine',
  systemPrompt: 'Tu es le MJ...',
  theme: CampaignTheme.HEROIC,
  difficulty: CampaignDifficulty.EASY,
  minPlayers: 2,
  maxPlayers: 5,
  estimatedDuration: 600,
  isPublic: true,
  isPremium: false,
  creatorId: 'user_system',
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date(),
};

describe('getPublicCampaigns', () => {
  beforeEach(() => vi.clearAllMocks());

  it('retourne les campagnes paginées sans systemPrompt', async () => {
    vi.mocked(prisma.$transaction).mockResolvedValue([[mockCampaign], 1]);

    const result = await getPublicCampaigns({ page: 1, limit: 12 });
    expect(result.campaigns).toHaveLength(1);
    expect(result.campaigns[0]).not.toHaveProperty('systemPrompt');
    expect(result.campaigns[0].title).toBe('La Mine Perdue de Phandelver');
    expect(result.total).toBe(1);
    expect(result.totalPages).toBe(1);
    expect(result.hasNext).toBe(false);
    expect(result.hasPrev).toBe(false);
  });

  it('filtre uniquement les campagnes isPublic=true', async () => {
    vi.mocked(prisma.$transaction).mockResolvedValue([[], 0]);

    const result = await getPublicCampaigns();
    expect(result.campaigns).toHaveLength(0);
    expect(result.total).toBe(0);
  });

  it('filtre par thème', async () => {
    vi.mocked(prisma.$transaction).mockResolvedValue([[mockCampaign], 1]);

    const result = await getPublicCampaigns({ theme: 'HEROIC' });

    expect(prisma.$transaction).toHaveBeenCalledOnce();
    expect(result.campaigns).toHaveLength(1);
    expect(result.campaigns[0].theme).toBe('HEROIC');
  });

  it('calcule correctement la pagination', async () => {
    vi.mocked(prisma.$transaction).mockResolvedValue([Array(10).fill(mockCampaign), 25]);

    const result = await getPublicCampaigns({ page: 2, limit: 10 });
    expect(result.page).toBe(2);
    expect(result.totalPages).toBe(3);
    expect(result.hasNext).toBe(true);
    expect(result.hasPrev).toBe(true);
  });

  it('retourne une liste vide si aucune campagne ne correspond', async () => {
    vi.mocked(prisma.$transaction).mockResolvedValue([[], 0]);

    const result = await getPublicCampaigns({ search: 'inexistant' });
    expect(result.campaigns).toHaveLength(0);
    expect(result.total).toBe(0);
    expect(result.totalPages).toBe(0);
  });
});

describe('getCampaignById', () => {
  beforeEach(() => vi.clearAllMocks());

  it('retourne la campagne avec systemPrompt pour usage interne', async () => {
    vi.mocked(prisma.campaign.findUnique).mockResolvedValue(mockCampaign);

    const result = await getCampaignById('campaign_1');
    expect(result.systemPrompt).toBe('Tu es le MJ...');
    expect(result.id).toBe('campaign_1');
  });

  it('lève 404 si la campagne est introuvable', async () => {
    vi.mocked(prisma.campaign.findUnique).mockResolvedValue(null);
    await expect(getCampaignById('unknown')).rejects.toMatchObject({ statusCode: 404 });
  });
});

describe('validateCampaignVisibility', () => {
  it('ne lève pas d\'erreur pour isPublic=true isPremium=true', () => {
    expect(() => validateCampaignVisibility(true, true)).not.toThrow();
  });

  it('ne lève pas d\'erreur pour isPublic=true isPremium=false', () => {
    expect(() => validateCampaignVisibility(true, false)).not.toThrow();
  });

  it('ne lève pas d\'erreur pour isPublic=false isPremium=false', () => {
    expect(() => validateCampaignVisibility(false, false)).not.toThrow();
  });

  it('lève 400 si isPublic=false et isPremium=true', () => {
    expect(() => validateCampaignVisibility(false, true)).toThrow();
  });
});

const validCreateInput = {
  title:             'Test Campaign',
  synopsis:          'Un synopsis de test suffisamment long pour passer la validation Zod',
  startLocation:     'Phandalin',
  mainQuest:         'Une quête principale suffisamment longue pour passer la validation Zod',
  theme:             'HEROIC' as const,
  difficulty:        'EASY' as const,
  minPlayers:        2,
  maxPlayers:        6,
  estimatedDuration: 120,
  isPublic:          false,
  isPremium:         false,
};

describe('createCampaign', () => {
  beforeEach(() => vi.clearAllMocks());

  it('retourne CampaignPublic sans systemPrompt', async () => {
    vi.mocked(prisma.campaign.create).mockResolvedValue({
      ...mockCampaign,
      ...validCreateInput,
      systemPrompt: 'Mock system prompt généré par IA',
    } as never);

    const result = await createCampaign('user_1', validCreateInput);

    expect(result).not.toHaveProperty('systemPrompt');
    expect(result.title).toBe('Test Campaign');
    expect(result.isPublic).toBe(false);
  });

  it('lève 400 si isPremium=true et isPublic=false — avant appel OpenAI', async () => {
    await expect(
      createCampaign('user_1', { ...validCreateInput, isPremium: true, isPublic: false }),
    ).rejects.toMatchObject({ statusCode: 400 });

    expect(generateSystemPrompt).not.toHaveBeenCalled();
    expect(prisma.campaign.create).not.toHaveBeenCalled();
  });

  it('appelle generateSystemPrompt avec les bons paramètres', async () => {
    vi.mocked(prisma.campaign.create).mockResolvedValue({
      ...mockCampaign,
      ...validCreateInput,
      systemPrompt: 'Mock system prompt généré par IA',
    } as never);

    await createCampaign('user_1', validCreateInput);

    expect(generateSystemPrompt).toHaveBeenCalledWith(
      expect.objectContaining({
        title:     'Test Campaign',
        theme:     'HEROIC',
        difficulty:'EASY',
      }),
    );
  });
});
