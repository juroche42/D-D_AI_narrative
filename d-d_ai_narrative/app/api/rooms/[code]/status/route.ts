import 'server-only';
import { type NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { success, error } from '@/lib/api/response/ApiResponse';
import { unauthorized, badRequest } from '@/lib/api/errors';
import { updateRoomStatus } from '@/lib/services/room';
import { z } from 'zod';

interface RouteContext {
  params: Promise<{ code: string }>;
}

const UpdateStatusSchema = z.object({
  status: z.enum(['IN_PROGRESS', 'FINISHED']),
});

/**
 * PATCH /api/rooms/:code/status — Changer l'état d'un salon (host uniquement)
 */
export async function PATCH(req: NextRequest, { params }: RouteContext): Promise<NextResponse> {
  try {
    const { code } = await params;
    const session = await auth();
    if (!session?.user) throw unauthorized('Connexion requise');

    const body = await req.json().catch(() => ({}));
    const parsed = UpdateStatusSchema.safeParse(body);
    if (!parsed.success) {
      throw badRequest(parsed.error.issues[0].message);
    }

    const room = await updateRoomStatus(code, session.user.id, parsed.data.status);
    return success(room, 'Statut du salon mis à jour');
  } catch (err) {
    return error(err);
  }
}
