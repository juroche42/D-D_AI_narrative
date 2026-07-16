import type { NextRequest, NextResponse } from 'next/server';
import { withErrorHandler, withValidation } from '@/lib/api/middleware';
import { CreateCharacterSchema, type CreateCharacter } from '@/lib/validations/character';
import { requireCurrentUserId } from '@/lib/auth/currentUser';
import { createCharacter, listCharacters } from '@/lib/services/character';
import * as ApiResponse from '@/lib/api/response';

/**
 * @openapi
 * /api/characters:
 *   get:
 *     summary: Liste des personnages
 *     description: Retourne la liste paginée des personnages du joueur authentifié.
 *     tags:
 *       - characters
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *           maximum: 100
 *     responses:
 *       200:
 *         description: Liste des personnages
 *       401:
 *         description: Non authentifié
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 */
export const GET = withErrorHandler(
  async (req: NextRequest): Promise<NextResponse> => {
    const userId = await requireCurrentUserId(req);

    const { searchParams } = new URL(req.url);
    const page = Math.max(1, Number(searchParams.get('page')) || 1);
    const limit = Math.min(100, Math.max(1, Number(searchParams.get('limit')) || 20));

    const { characters, total } = await listCharacters(userId, page, limit);
    return ApiResponse.paginated(characters, total, page, limit);
  },
);

/**
 * @openapi
 * /api/characters:
 *   post:
 *     summary: Créer un personnage
 *     description: Crée un nouveau personnage D&D avec ses statistiques et son historique.
 *     tags:
 *       - characters
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
 *               - race
 *               - class
 *               - stats
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 30
 *                 example: Thorin Rochefer
 *               race:
 *                 type: string
 *                 enum: [HUMAN, ELF, DWARF, HALF_ORC, TIEFLING, HALFLING]
 *                 example: DWARF
 *               class:
 *                 type: string
 *                 enum: [FIGHTER, MAGE, ROGUE, CLERIC, BARD, RANGER]
 *                 example: FIGHTER
 *               stats:
 *                 type: object
 *                 required:
 *                   - strength
 *                   - dexterity
 *                   - constitution
 *                   - intelligence
 *                   - wisdom
 *                   - charisma
 *                 properties:
 *                   strength:
 *                     type: integer
 *                     minimum: 1
 *                     maximum: 20
 *                   dexterity:
 *                     type: integer
 *                     minimum: 1
 *                     maximum: 20
 *                   constitution:
 *                     type: integer
 *                     minimum: 1
 *                     maximum: 20
 *                   intelligence:
 *                     type: integer
 *                     minimum: 1
 *                     maximum: 20
 *                   wisdom:
 *                     type: integer
 *                     minimum: 1
 *                     maximum: 20
 *                   charisma:
 *                     type: integer
 *                     minimum: 1
 *                     maximum: 20
 *     responses:
 *       201:
 *         description: Personnage créé avec succès
 *       400:
 *         description: Données invalides
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *       401:
 *         description: Non authentifié
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *       409:
 *         description: Un personnage avec ce nom existe déjà
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 */
export const POST = withErrorHandler(
  withValidation(
    CreateCharacterSchema,
    async (req: NextRequest, ctx: { data: CreateCharacter }): Promise<NextResponse> => {
      const userId = await requireCurrentUserId(req);
      const character = await createCharacter(userId, ctx.data);
      return ApiResponse.created(character, 'Personnage créé avec succès');
    },
  ),
);
