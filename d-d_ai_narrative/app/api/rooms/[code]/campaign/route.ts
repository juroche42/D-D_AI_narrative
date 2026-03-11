import type { NextRequest } from 'next/server';
import { withErrorHandler } from '@/lib/api/middleware/withErrorHandler';
import { success } from '@/lib/api/response';
import { selectCampaign } from '@/lib/services/room/roomService';
import { auth } from '@/lib/auth';
import { unauthorized, badRequest } from '@/lib/api/errors';
import { z } from 'zod';

const SelectCampaignSchema = z.object({
  campaignId: z.string().nullable(),
});

/**
 * POST /api/rooms/:code/campaign
 * Sélectionne ou désélectionne une campagne pour le salon.
 * Auth requise — host uniquement.
 * systemPrompt jamais retourné.
 */
export function POST(req: NextRequest, { params }: { params: Promise<{ code: string }> }) {
  return withErrorHandler(async (innerReq: NextRequest) => {
    const session = await auth();
    if (!session?.user) throw unauthorized();

    const { code }  = await params;
    const body      = await innerReq.json().catch(() => ({}));
    const parsed    = SelectCampaignSchema.safeParse(body);
    if (!parsed.success) throw badRequest(parsed.error.issues[0].message);

    const room = await selectCampaign(code, session.user.id, parsed.data.campaignId);
    return success(room, 'Campagne sélectionnée');
  })(req);
}
