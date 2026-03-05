import type { NextRequest, NextResponse } from 'next/server';
import { withErrorHandler } from '@/lib/api/middleware';
import { unauthorized } from '@/lib/api/errors';
import * as ApiResponse from '@/lib/api/response';
import { auth } from '@/lib/auth';
import { createRoom } from '@/lib/services/room';

/**
 * POST /api/rooms — Créer une salle de jeu
 */
export const POST = withErrorHandler(async (_req: NextRequest): Promise<NextResponse> => {
  const session = await auth();
  if (!session?.user) throw unauthorized('Connexion requise');

  const room = await createRoom(session.user.id, session.user.username);
  return ApiResponse.created(room, 'Salon créé avec succès');
});
