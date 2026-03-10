import { prisma } from '@/lib/prisma';
import { CampaignTheme, CampaignDifficulty } from '@/app/generated/prisma/client';
import { notFound, badRequest } from '@/lib/api/errors';
import { generateSystemPrompt } from './promptGenerator';
import type { CreateCampaignInput } from '@/lib/validations/campaign';

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

export interface CampaignFilters {
  theme?: string;
  difficulty?: string;
  search?: string;
  isPremium?: boolean;
  page?: number;
  limit?: number;
}

export interface PaginatedCampaigns {
  campaigns: CampaignPublic[];
  total: number;
  page: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
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
 * Récupère les campagnes publiques avec filtres et pagination.
 * Utilise l'index @@index([isPublic, isPremium]) pour les performances.
 */
export async function getPublicCampaigns(filters: CampaignFilters = {}): Promise<PaginatedCampaigns> {
  const { theme, difficulty, search, isPremium, page = 1, limit = 12 } = filters;

  const skip = (page - 1) * limit;

  const where = {
    isPublic: true,
    ...(theme && { theme: theme as CampaignTheme }),
    ...(difficulty && { difficulty: difficulty as CampaignDifficulty }),
    ...(isPremium !== undefined && { isPremium }),
    ...(search && {
      OR: [
        { title: { contains: search, mode: 'insensitive' as const } },
        { synopsis: { contains: search, mode: 'insensitive' as const } },
      ],
    }),
  };

  const [campaigns, total] = await prisma.$transaction([
    prisma.campaign.findMany({
      where,
      orderBy: [{ isPremium: 'asc' }, { createdAt: 'asc' }],
      skip,
      take: limit,
    }),
    prisma.campaign.count({ where }),
  ]);

  const totalPages = Math.ceil(total / limit);

  return {
    campaigns: campaigns.map(toCampaignPublic),
    total,
    page,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1,
  };
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

/**
 * Crée une nouvelle campagne personnalisée.
 * Génère automatiquement le systemPrompt via l'IA (OpenAI).
 * La campagne est PRIVÉE par défaut (isPublic = false).
 * @throws AppError 400 si isPublic=false et isPremium=true
 */
export async function createCampaign(
  creatorId: string,
  data: CreateCampaignInput,
): Promise<CampaignPublic> {
  validateCampaignVisibility(data.isPublic, data.isPremium);

  const systemPrompt = await generateSystemPrompt({
    title:         data.title,
    synopsis:      data.synopsis,
    startLocation: data.startLocation,
    mainQuest:     data.mainQuest,
    theme:         data.theme as CampaignTheme,
    difficulty:    data.difficulty as CampaignDifficulty,
  });

  const campaign = await prisma.campaign.create({
    data: {
      ...data,
      creatorId,
      systemPrompt,
      theme:      data.theme as CampaignTheme,
      difficulty: data.difficulty as CampaignDifficulty,
    },
  });

  return toCampaignPublic(campaign);
}

/**
 * Récupère toutes les campagnes créées par un utilisateur (publiques + privées).
 * Usage interne uniquement — auth requise en amont.
 */
export async function getMyCampaigns(creatorId: string): Promise<CampaignPublic[]> {
  const campaigns = await prisma.campaign.findMany({
    where: { creatorId },
    orderBy: { createdAt: 'desc' },
  });
  return campaigns.map(toCampaignPublic);
}
