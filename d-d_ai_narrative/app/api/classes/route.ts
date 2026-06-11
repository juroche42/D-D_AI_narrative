import type { NextRequest, NextResponse } from 'next/server';
import { withErrorHandler } from '@/lib/api/middleware';
import * as ApiResponse from '@/lib/api/response';
import { CLASS_DEFINITIONS } from '@/lib/constants/classes';

/**
 * @openapi
 * /api/classes:
 *   get:
 *     summary: Liste des classes disponibles
 *     description: Retourne la liste de toutes les classes jouables dans D&D AI Narrative.
 *     tags:
 *       - characters
 *     responses:
 *       200:
 *         description: Liste des classes
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         example: FIGHTER
 *                       name:
 *                         type: string
 *                         example: Guerrier
 *                       description:
 *                         type: string
 */
export const GET = withErrorHandler(async (_req: NextRequest): Promise<NextResponse> => {
  return ApiResponse.success(CLASS_DEFINITIONS, 'Liste des classes récupérée avec succès');
});

