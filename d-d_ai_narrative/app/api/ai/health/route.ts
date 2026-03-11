import type { NextRequest } from 'next/server';
import { withErrorHandler } from '@/lib/api/middleware/withErrorHandler';
import * as ApiResponse from '@/lib/api/response';
import { testConnection } from '@/lib/services/ai/openAIService';
import { auth } from '@/lib/auth';
import { unauthorized } from '@/lib/api/errors';

/**
 * GET /api/ai/health — Auth requise (ne pas exposer l'état de la clé publiquement).
 */
export const GET = withErrorHandler(async (_req: NextRequest) => {
  const session = await auth();
  if (!session?.user) throw unauthorized();

  const result = await testConnection();
  return ApiResponse.success({
    openai:    result.ok ? 'connected' : 'unreachable',
    model:     result.model,
    latencyMs: result.latencyMs,
  });
});
