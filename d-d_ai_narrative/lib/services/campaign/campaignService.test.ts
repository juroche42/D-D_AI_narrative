import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CampaignTheme, CampaignDifficulty } from '@/app/generated/prisma/enums';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    campaign: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
    },
  },
}));

import { getPublicCampaigns, getCampaignById, validateCampaignVisibility } from './campaignService';
import { prisma } from '@/lib/prisma';

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

  it('retourne les campagnes publiques sans systemPrompt', async () => {
    vi.mocked(prisma.campaign.findMany).mockResolvedValue([mockCampaign]);

    const result = await getPublicCampaigns();
    expect(result).toHaveLength(1);
    expect(result[0]).not.toHaveProperty('systemPrompt');
    expect(result[0].title).toBe('La Mine Perdue de Phandelver');
  });

  it('filtre uniquement les campagnes isPublic=true', async () => {
    vi.mocked(prisma.campaign.findMany).mockResolvedValue([]);

    const result = await getPublicCampaigns();
    expect(prisma.campaign.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { isPublic: true } })
    );
    expect(result).toHaveLength(0);
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
