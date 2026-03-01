import type { NextRequest, NextResponse } from 'next/server';
import { withErrorHandler } from '@/lib/api/middleware';
import * as ApiResponse from '@/lib/api/response';
import { requireCurrentUserId } from '@/lib/auth/currentUser';
import { getUserMe } from '@/lib/services/users';

/**
 * @openapi
 * /api/users/me:
 *   get:
 *     summary: Récupérer le profil de l'utilisateur courant
 *     description: Retourne les informations publiques du compte et les préférences/statistiques de profil.
 *     tags:
 *       - users
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Profil utilisateur récupéré
 *       401:
 *         description: Contexte d'authentification manquant
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *       404:
 *         description: Utilisateur introuvable
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 */
export const GET = withErrorHandler(async (req: NextRequest): Promise<NextResponse> => {
  const userId = requireCurrentUserId(req);
  const user = await getUserMe(userId);

  return ApiResponse.success(user, 'Profil utilisateur récupéré');
});
