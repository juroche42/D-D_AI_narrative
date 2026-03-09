import { NextRequest } from 'next/server';
import { withErrorHandler } from '@/lib/api/middleware/withErrorHandler';
import { success } from '@/lib/api/response';
import { getPublicCampaigns } from '@/lib/services/campaign/campaignService';
import { CampaignFiltersSchema } from '@/lib/validations/campaign';
import { badRequest } from '@/lib/api/errors';

/**
 * GET /api/campaigns
 *
 * Query params optionnels :
 *   ?theme=HEROIC
 *   ?difficulty=EASY
 *   ?search=phandelver
 *   ?isPremium=false
 *   ?page=1&limit=12
 *
 * Pas d'auth requise — catalogue public.
 * systemPrompt jamais inclus dans la réponse (absent de CampaignPublic).
 */
export const GET = withErrorHandler(async (req: NextRequest) => {
  const { searchParams } = new URL(req.url);

  const raw = {
    theme:      searchParams.get('theme') ?? undefined,
    difficulty: searchParams.get('difficulty') ?? undefined,
    search:     searchParams.get('search') ?? undefined,
    isPremium:  searchParams.get('isPremium') ?? undefined,
    page:       searchParams.get('page') ?? undefined,
    limit:      searchParams.get('limit') ?? undefined,
  };

  const parsed = CampaignFiltersSchema.safeParse(raw);
  if (!parsed.success) throw badRequest(parsed.error.issues[0].message);

  const result = await getPublicCampaigns(parsed.data);
  return success(result);
});
