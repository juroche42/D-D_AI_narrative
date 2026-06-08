import type { NextRequest } from 'next/server';
import { withErrorHandler } from '@/lib/api/middleware/withErrorHandler';
import { success } from '@/lib/api/response';
import { getLobbyAvailableCampaigns } from '@/lib/services/campaign/campaignService';
import { CampaignFiltersSchema } from '@/lib/validations/campaign';
import { auth } from '@/lib/auth';
import { unauthorized, badRequest, notFound, forbidden } from '@/lib/api/errors';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/rooms/:code/campaigns
 * Campagnes disponibles pour le lobby : publiques + campagnes privées du host connecté.
 * Auth requise — l'utilisateur doit être membre du salon.
 * Supporte : ?search=&theme=&difficulty=&isPremium=&page=&limit=
 */
export function GET(req: NextRequest, { params }: { params: Promise<{ code: string }> }) {
  return withErrorHandler(async (innerReq: NextRequest) => {
    const session = await auth();
    if (!session?.user) throw unauthorized();

    const { code } = await params;
    const room = await prisma.room.findUnique({
      where: { code: code.toUpperCase() },
      select: { id: true },
    });
    if (!room) throw notFound('Salon');

    const isMember = await prisma.roomPlayer.findFirst({
      where: { roomId: room.id, userId: session.user.id },
      select: { id: true },
    });
    if (!isMember) throw forbidden('Vous n\'êtes pas membre de ce salon');

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
