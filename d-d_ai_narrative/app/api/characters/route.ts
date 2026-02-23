import type { NextRequest, NextResponse } from 'next/server';
import { withErrorHandler, withValidation } from '@/lib/api/middleware';
import { notImplemented } from '@/lib/api/errors';
import { CreateCharacterSchema, type CreateCharacter } from '@/lib/validations/character';

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
 *       501:
 *         description: Non implémenté
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 */
export const GET = withErrorHandler(
  async (_req: NextRequest): Promise<NextResponse> => {
    throw notImplemented('GET /api/characters is not implemented yet');
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
 *                 enum: [Human, Elf, Dwarf, Halfling, Gnome, Half-Elf, Half-Orc, Tiefling, Dragonborn]
 *                 example: Dwarf
 *               class:
 *                 type: string
 *                 enum: [Barbarian, Bard, Cleric, Druid, Fighter, Monk, Paladin, Ranger, Rogue, Sorcerer, Warlock, Wizard]
 *                 example: Fighter
 *               backstory:
 *                 type: string
 *                 maxLength: 2000
 *                 example: Ancien forgeron des montagnes du Nord...
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
 *         description: Personnage créé
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
    CreateCharacterSchema,
    async (_req: NextRequest, _ctx: { data: CreateCharacter }): Promise<NextResponse> => {
      throw notImplemented('POST /api/characters is not implemented yet');
    },
  ),
);
