import 'server-only';
import { type NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { success, error } from '@/lib/api/response/ApiResponse';
import { unauthorized } from '@/lib/api/errors';
import { togglePlayerReady } from '@/lib/services/room';

interface RouteContext {
  params: Promise<{ code: string }>;
}

/**
 * POST /api/rooms/:code/ready — Basculer son état prêt (non-host uniquement)
 */
export async function POST(_req: NextRequest, { params }: RouteContext): Promise<NextResponse> {
  try {
    const { code } = await params;
    const session = await auth();
    if (!session?.user) throw unauthorized('Connexion requise');

    const isReady = await togglePlayerReady(code, session.user.id);
    return success(
      { isReady },
      isReady ? 'Vous êtes prêt !' : 'Vous avez annulé votre statut prêt',
    );
  } catch (err) {
    return error(err);
  }
}
