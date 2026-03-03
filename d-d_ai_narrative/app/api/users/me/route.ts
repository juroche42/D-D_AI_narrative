import type { NextRequest, NextResponse } from 'next/server';
import { withErrorHandler } from '@/lib/api/middleware';
import { withValidation } from '@/lib/api/middleware';
import * as ApiResponse from '@/lib/api/response';
import { requireCurrentUserId } from '@/lib/auth/currentUser';
import { getUserMe, updateUserMe } from '@/lib/services/users';
import { UpdateUserMeSchema, type UpdateUserMeInput } from '@/lib/validations/user';

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
  const userId = await requireCurrentUserId(req);
  const user = await getUserMe(userId);

  return ApiResponse.success(user, 'Profil utilisateur récupéré');
});

/**
 * @openapi
 * /api/users/me:
 *   patch:
 *     summary: Mettre à jour le profil de l'utilisateur courant
 *     description: Met à jour les champs profil (pseudo, bio, préférences) et peut changer le mot de passe.
 *     tags:
 *       - users
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *               avatarUrl:
 *                 type: string
 *               bio:
 *                 type: string
 *               language:
 *                 type: string
 *                 enum: [FR, EN]
 *               darkMode:
 *                 type: boolean
 *               currentPassword:
 *                 type: string
 *               newPassword:
 *                 type: string
 *               confirmNewPassword:
 *                 type: string
 *     responses:
 *       200:
 *         description: Profil utilisateur mis à jour
 *       400:
 *         description: Données invalides
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *       401:
 *         description: Authentification manquante ou mot de passe actuel invalide
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
 *       409:
 *         description: Pseudo déjà utilisé
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 */
export const PATCH = withErrorHandler(
  withValidation(
    UpdateUserMeSchema,
    async (req: NextRequest, { data }: { data: UpdateUserMeInput }): Promise<NextResponse> => {
      const userId = await requireCurrentUserId(req);
      const updated = await updateUserMe(userId, data);
      return ApiResponse.success(updated, 'Profil utilisateur mis à jour');
    },
  ),
);
