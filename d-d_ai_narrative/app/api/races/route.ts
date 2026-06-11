import type { NextRequest, NextResponse } from 'next/server';
import { withErrorHandler } from '@/lib/api/middleware';
import * as ApiResponse from '@/lib/api/response';
import { RACE_DEFINITIONS } from '@/lib/constants/races';

/**
 * @openapi
 * /api/races:
 *   get:
 *     summary: Liste des races disponibles
 *     description: Retourne la liste de toutes les races jouables dans D&D AI Narrative.
 *     tags:
 *       - characters
 *     responses:
 *       200:
 *         description: Liste des races
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
 *                         example: HUMAN
 *                       name:
 *                         type: string
 *                         example: Humain
 *                       description:
 *                         type: string
 */
export const GET = withErrorHandler(async (_req: NextRequest): Promise<NextResponse> => {
  return ApiResponse.success(RACE_DEFINITIONS, 'Liste des races récupérée avec succès');
});

