import { withErrorHandler, withValidation } from '@/lib/api/middleware';
import { LoginSchema } from '@/lib/validations/auth';
import { loginUser } from '@/lib/services/auth';
import * as ApiResponse from '@/lib/api/response';

/**
 * @openapi
 * /api/auth/login:
 *   post:
 *     summary: Connexion utilisateur
 *     description: Authentifie un utilisateur et retourne ses données publiques.
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
 *             properties:
 *               username:
 *                 type: string
 *                 example: ThorinHero
 *               password:
 *                 type: string
 *                 example: Password1
 *     responses:
 *       200:
 *         description: Connexion réussie
 *       400:
 *         description: Données invalides
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *       401:
 *         description: Identifiants incorrects
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 */
export const POST = withErrorHandler(
  withValidation(LoginSchema, async (_req, { data }) => {
    const user = await loginUser(data);
    return ApiResponse.success(user, 'Connexion réussie');
  }),
);
