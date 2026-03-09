import { prisma } from '@/lib/prisma';
import { CampaignTheme, CampaignDifficulty } from '@/app/generated/prisma/client';
import { notFound, badRequest } from '@/lib/api/errors';

export interface CampaignPublic {
  id: string;
  title: string;
  synopsis: string;
  startLocation: string;
  mainQuest: string;
  theme: CampaignTheme;
  difficulty: CampaignDifficulty;
  minPlayers: number;
  maxPlayers: number;
  estimatedDuration: number;
  isPublic: boolean;
  isPremium: boolean;
  creatorId: string;
  createdAt: Date;
  // systemPrompt intentionnellement absent du DTO public — usage interne IA uniquement
}

/**
 * Valide la cohérence isPublic / isPremium.
 * isPublic=false + isPremium=true est un cas invalide — une campagne premium doit être publique.
 * @throws AppError 400
 */
export function validateCampaignVisibility(isPublic: boolean, isPremium: boolean): void {
  if (!isPublic && isPremium) {
    throw badRequest('Une campagne premium doit obligatoirement être publique');
  }
}

function toCampaignPublic(campaign: {
  id: string;
  title: string;
  synopsis: string;
  startLocation: string;
  mainQuest: string;
  theme: CampaignTheme;
  difficulty: CampaignDifficulty;
  minPlayers: number;
  maxPlayers: number;
  estimatedDuration: number;
  isPublic: boolean;
  isPremium: boolean;
  creatorId: string;
  createdAt: Date;
}): CampaignPublic {
  return {
    id: campaign.id,
    title: campaign.title,
    synopsis: campaign.synopsis,
    startLocation: campaign.startLocation,
    mainQuest: campaign.mainQuest,
    theme: campaign.theme,
    difficulty: campaign.difficulty,
    minPlayers: campaign.minPlayers,
    maxPlayers: campaign.maxPlayers,
    estimatedDuration: campaign.estimatedDuration,
    isPublic: campaign.isPublic,
    isPremium: campaign.isPremium,
    creatorId: campaign.creatorId,
    createdAt: campaign.createdAt,
  };
}

/**
 * Récupère toutes les campagnes publiques.
 * Sera étendu avec filtres/pagination en US-05-02.
 */
export async function getPublicCampaigns(): Promise<CampaignPublic[]> {
  const campaigns = await prisma.campaign.findMany({
    where: { isPublic: true },
    orderBy: [{ isPremium: 'asc' }, { createdAt: 'asc' }],
  });
  return campaigns.map(toCampaignPublic);
}

/**
 * Récupère une campagne par son ID.
 * Retourne aussi le systemPrompt — usage interne IA uniquement, ne jamais exposer en API publique.
 * @throws AppError 404 si la campagne n'existe pas
 */
export async function getCampaignById(id: string): Promise<CampaignPublic & { systemPrompt: string }> {
  const campaign = await prisma.campaign.findUnique({ where: { id } });
  if (!campaign) throw notFound('Campaign');
  return { ...toCampaignPublic(campaign), systemPrompt: campaign.systemPrompt };
}
