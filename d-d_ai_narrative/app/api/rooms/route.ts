import type { NextRequest, NextResponse } from 'next/server';
import { withErrorHandler, withValidation } from '@/lib/api/middleware';
import { notImplemented } from '@/lib/api/errors';
import * as ApiResponse from '@/lib/api/response';
import { CreateRoomSchema, type CreateRoom } from '@/lib/validations/room';

/**
 * @openapi
 * /api/rooms:
 *   get:
 *     summary: Liste des salles de jeu
 *     description: Retourne la liste paginée des salles de jeu disponibles.
 *     tags:
 *       - rooms
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Numéro de page
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *           maximum: 100
 *         description: Nombre d'éléments par page
 *     responses:
 *       200:
 *         description: Liste des salles
 *       501:
 *         description: Non implémenté
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 */
export const GET = withErrorHandler(
  async (_req: NextRequest): Promise<NextResponse> => {
    throw notImplemented('GET /api/rooms is not implemented yet');
  },
);

/**
 * @openapi
 * /api/rooms:
 *   post:
 *     summary: Créer une salle de jeu
 *     description: Crée une nouvelle salle de jeu avec les paramètres fournis.
 *     tags:
 *       - rooms
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - maxPlayers
 *               - isPrivate
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 3
 *                 maxLength: 50
 *                 example: La Taverne du Dragon Rouge
 *               description:
 *                 type: string
 *                 maxLength: 500
 *                 example: Une campagne épique dans les Royaumes Oubliés
 *               maxPlayers:
 *                 type: integer
 *                 minimum: 2
 *                 maximum: 8
 *                 example: 5
 *               isPrivate:
 *                 type: boolean
 *                 example: false
 *     responses:
 *       201:
 *         description: Salle créée
 *       400:
 *         description: Données invalides
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *       501:
 *         description: Non implémenté
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 */
export const POST = withErrorHandler(
  withValidation(
    CreateRoomSchema,
    async (_req: NextRequest, _ctx: { data: CreateRoom }): Promise<NextResponse> => {
      throw notImplemented('POST /api/rooms is not implemented yet');
    },
  ),
);
