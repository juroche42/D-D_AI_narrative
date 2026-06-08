import { NextRequest } from 'next/server';
import { withErrorHandler } from '@/lib/api/middleware/withErrorHandler';
import { success, created } from '@/lib/api/response';
import { getPublicCampaigns, createCampaign } from '@/lib/services/campaign/campaignService';
import { CampaignFiltersSchema, CreateCampaignSchema } from '@/lib/validations/campaign';
import { badRequest, unauthorized } from '@/lib/api/errors';
import { auth } from '@/lib/auth';

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

/**
 * POST /api/campaigns — Créer une campagne personnalisée
 * Auth requise — la campagne est liée au créateur connecté.
 * Le systemPrompt est généré côté serveur — jamais retourné dans la réponse.
 */
export const POST = withErrorHandler(async (req: NextRequest) => {
  const session = await auth();
  if (!session?.user) throw unauthorized('Connexion requise pour créer une campagne');

  const body = await req.json().catch(() => ({}));
  const parsed = CreateCampaignSchema.safeParse(body);
  if (!parsed.success) throw badRequest(parsed.error.issues[0].message);

  const campaign = await createCampaign(session.user.id, parsed.data);
  return created(campaign, 'Campagne créée avec succès');
});
