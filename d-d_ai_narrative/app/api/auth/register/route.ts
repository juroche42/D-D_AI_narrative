import type { NextResponse } from 'next/server';
import { withErrorHandler } from '@/lib/api/middleware';
import { withValidation } from '@/lib/api/middleware';
import * as ApiResponse from '@/lib/api/response';
import { RegisterSchema } from '@/lib/validations/auth';
import { registerUser } from '@/lib/services/auth';

/**
 * @openapi
 * /api/auth/register:
 *   post:
 *     summary: Inscription d'un nouvel utilisateur
 *     description: >
 *       Crée un compte utilisateur avec un pseudo unique (3-20 caractères alphanumériques)
 *       et un mot de passe sécurisé (8+ chars, majuscule, chiffre). Le mot de passe est
 *       stocké hashé (bcrypt, 12 rounds) — jamais en clair.
 *     tags:
 *       - auth
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - password
 *               - confirmPassword
 *             properties:
 *               username:
 *                 type: string
 *                 minLength: 3
 *                 maxLength: 20
 *                 pattern: '^[a-zA-Z0-9_-]+$'
 *                 example: ThorinHero
 *               password:
 *                 type: string
 *                 minLength: 8
 *                 maxLength: 72
 *                 example: Password1
 *               confirmPassword:
 *                 type: string
 *                 example: Password1
 *     responses:
 *       201:
 *         description: Compte créé avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       example: clxyz123abc
 *                     username:
 *                       type: string
 *                       example: ThorinHero
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *                 message:
 *                   type: string
 *                   example: Compte créé avec succès
 *       400:
 *         description: Données invalides (validation Zod échouée)
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
export const POST = withErrorHandler(
  withValidation(RegisterSchema, async (_req, { data }): Promise<NextResponse> => {
    const { confirmPassword: _, ...input } = data;
    const user = await registerUser(input);
    return ApiResponse.created(user, 'Compte créé avec succès');
  }),
);
