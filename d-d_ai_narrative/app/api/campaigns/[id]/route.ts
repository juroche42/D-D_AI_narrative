import { type NextRequest, NextResponse } from 'next/server';
import { success, error } from '@/lib/api/response/ApiResponse';
import { notFound } from '@/lib/api/errors';
import { getCampaignById } from '@/lib/services/campaign/campaignService';

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/campaigns/:id
 * Pas d'auth requise — détail d'une campagne publique.
 * systemPrompt jamais inclus dans la réponse (absent de CampaignPublic).
 */
export async function GET(_req: NextRequest, { params }: RouteContext): Promise<NextResponse> {
  try {
    const { id } = await params;
    const { systemPrompt: _, ...publicData } = await getCampaignById(id);
    if (!publicData.isPublic) throw notFound('Campaign');
    return success(publicData);
  } catch (err) {
    return error(err);
  }
}
