import { type NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { success, error } from '@/lib/api/response/ApiResponse';
import { unauthorized } from '@/lib/api/errors';
import { leaveRoom } from '@/lib/services/room';

interface RouteContext {
  params: Promise<{ code: string }>;
}

/**
 * POST /api/rooms/:code/leave — Quitter un salon
 */
export async function POST(_req: NextRequest, { params }: RouteContext): Promise<NextResponse> {
  try {
    const { code } = await params;
    const session = await auth();
    if (!session?.user) throw unauthorized('Connexion requise');

    await leaveRoom(code, session.user.id);
    return success(null, 'Vous avez quitté le salon');
  } catch (err) {
    return error(err);
  }
}
