import type { NextRequest, NextResponse } from 'next/server';
import { withErrorHandler } from '@/lib/api/middleware';
import { notImplemented } from '@/lib/api/errors';

/**
 * @openapi
 * /api/auth/{...nextauth}:
 *   get:
 *     summary: Handler NextAuth (GET)
 *     description: Gère les requêtes GET de NextAuth (callback, session, signout...).
 *     tags:
 *       - auth
 *     parameters:
 *       - in: path
 *         name: nextauth
 *         required: true
 *         schema:
 *           type: array
 *           items:
 *             type: string
 *         description: Segments de route NextAuth (ex. signIn, callback/google)
 *     responses:
 *       501:
 *         description: Non implémenté — NextAuth sera configuré dans une prochaine US
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 */
export const GET = withErrorHandler(
  async (_req: NextRequest): Promise<NextResponse> => {
    throw notImplemented('NextAuth is not configured yet — coming in a future US');
  },
);

/**
 * @openapi
 * /api/auth/{...nextauth}:
 *   post:
 *     summary: Handler NextAuth (POST)
 *     description: Gère les requêtes POST de NextAuth (signIn, signOut, CSRF...).
 *     tags:
 *       - auth
 *     parameters:
 *       - in: path
 *         name: nextauth
 *         required: true
 *         schema:
 *           type: array
 *           items:
 *             type: string
 *     responses:
 *       501:
 *         description: Non implémenté — NextAuth sera configuré dans une prochaine US
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 */
export const POST = withErrorHandler(
  async (_req: NextRequest): Promise<NextResponse> => {
    throw notImplemented('NextAuth is not configured yet — coming in a future US');
  },
);
