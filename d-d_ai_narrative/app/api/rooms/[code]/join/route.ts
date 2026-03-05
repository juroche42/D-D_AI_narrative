import { type NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { success, error } from '@/lib/api/response/ApiResponse';
import { unauthorized } from '@/lib/api/errors';
import { joinRoom } from '@/lib/services/room';

interface RouteContext {
  params: Promise<{ code: string }>;
}

/**
 * POST /api/rooms/:code/join — Rejoindre un salon existant
 */
export async function POST(_req: NextRequest, { params }: RouteContext): Promise<NextResponse> {
  try {
    const { code } = await params;
    const session = await auth();
    if (!session?.user) throw unauthorized('Connexion requise');

    const room = await joinRoom(code, session.user.id);
    return success(room, 'Vous avez rejoint le salon avec succès');
  } catch (err) {
    return error(err);
  }
}
