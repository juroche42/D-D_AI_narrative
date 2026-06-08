import { NextRequest } from 'next/server';
import { z } from 'zod';
import { withErrorHandler } from '@/lib/api/middleware/withErrorHandler';
import { success } from '@/lib/api/response';
import { unauthorized, badRequest } from '@/lib/api/errors';
import { auth } from '@/lib/auth';
import { previewSystemPrompt } from '@/lib/services/campaign/promptGenerator';
import { CampaignTheme, CampaignDifficulty } from '@/app/generated/prisma/client';

const previewSchema = z.object({
  title:         z.string().min(3).max(100),
  synopsis:      z.string().min(20).max(1000),
  startLocation: z.string().min(3).max(200),
  mainQuest:     z.string().min(20).max(500),
  theme:         z.enum(['HORROR', 'HEROIC', 'MYSTERY', 'INVESTIGATION']),
  difficulty:    z.enum(['EASY', 'MEDIUM', 'HARD']),
});

/**
 * POST /api/campaigns/preview-prompt
 * Génère un aperçu du systemPrompt sans créer la campagne.
 * Auth requise pour éviter les abus (coût OpenAI).
 * systemPrompt retourné ici — usage client uniquement pour la prévisualisation.
 */
export const POST = withErrorHandler(async (req: NextRequest) => {
  const session = await auth();
  if (!session?.user) throw unauthorized('Connexion requise');

  const body = await req.json().catch(() => ({}));
  const parsed = previewSchema.safeParse(body);
  if (!parsed.success) throw badRequest(parsed.error.issues[0].message);

  const systemPrompt = await previewSystemPrompt({
    ...parsed.data,
    theme:      parsed.data.theme as CampaignTheme,
    difficulty: parsed.data.difficulty as CampaignDifficulty,
  });

  return success({ systemPrompt });
});
