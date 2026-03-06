import { type NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { success, error } from '@/lib/api/response/ApiResponse';
import { unauthorized } from '@/lib/api/errors';
import { getRoomPreview } from '@/lib/services/room';

interface RouteContext {
  params: Promise<{ code: string }>;
}

/**
 * GET /api/rooms/:code — Récupère les infos publiques d'un salon (preview avant de rejoindre)
 */
export async function GET(_req: NextRequest, { params }: RouteContext): Promise<NextResponse> {
  try {
    const { code } = await params;
    const session = await auth();
    if (!session?.user) throw unauthorized('Connexion requise');

    const room = await getRoomPreview(code);
    return success(room);
  } catch (err) {
    return error(err);
  }
}
