import type { NextRequest } from 'next/server';
import { withErrorHandler } from '@/lib/api/middleware/withErrorHandler';
import { success } from '@/lib/api/response';
import { getLobbyAvailableCampaigns } from '@/lib/services/campaign/campaignService';
import { CampaignFiltersSchema } from '@/lib/validations/campaign';
import { auth } from '@/lib/auth';
import { unauthorized, badRequest } from '@/lib/api/errors';

/**
 * GET /api/rooms/:code/campaigns
 * Campagnes disponibles pour le lobby : publiques + campagnes privées du host connecté.
 * Auth requise.
 * Supporte : ?search=&theme=&difficulty=&isPremium=&page=&limit=
 */
export function GET(req: NextRequest) {
  return withErrorHandler(async (innerReq: NextRequest) => {
    const session = await auth();
    if (!session?.user) throw unauthorized();

    const { searchParams } = new URL(innerReq.url);
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

    const result = await getLobbyAvailableCampaigns(session.user.id, parsed.data);
    return success(result);
  })(req);
}
