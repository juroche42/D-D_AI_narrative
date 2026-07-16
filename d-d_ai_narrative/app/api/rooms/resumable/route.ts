import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { success, error } from '@/lib/api/response/ApiResponse';
import { unauthorized } from '@/lib/api/errors';
import { getResumableGames } from '@/lib/services/room';

/**
 * @openapi
 * /api/rooms/resumable:
 *   get:
 *     summary: Parties reprenables
 *     description: >
 *       Retourne les parties en cours (IN_PROGRESS) dont le joueur authentifié
 *       est membre, avec le scénario et le nombre de joueurs, pour permettre de
 *       reprendre là où la partie s'est arrêtée.
 *     tags:
 *       - rooms
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Liste des parties reprenables
 *       401:
 *         description: Non authentifié
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 */
export async function GET(): Promise<NextResponse> {
  try {
    const session = await auth();
    if (!session?.user?.id) throw unauthorized('Connexion requise');

    const games = await getResumableGames(session.user.id);
    return success(games);
  } catch (err) {
    return error(err);
  }
}
