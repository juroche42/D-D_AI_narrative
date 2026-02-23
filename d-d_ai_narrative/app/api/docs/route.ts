import { NextResponse } from 'next/server';
import { swaggerSpec } from '@/lib/swagger';

/**
 * @openapi
 * /api/docs:
 *   get:
 *     summary: Spécification OpenAPI
 *     description: Retourne la spécification OpenAPI 3.0 complète au format JSON. Utilisée par SwaggerUI.
 *     tags:
 *       - health
 *     responses:
 *       200:
 *         description: Spécification OpenAPI JSON
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 */
export async function GET(): Promise<NextResponse> {
  return NextResponse.json(swaggerSpec);
}
