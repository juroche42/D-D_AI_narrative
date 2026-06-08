import type { NextRequest } from 'next/server';
import { withErrorHandler } from '@/lib/api/middleware/withErrorHandler';
import { withValidation } from '@/lib/api/middleware/withValidation';
import * as ApiResponse from '@/lib/api/response';
import { getIndexStats, searchSimilarDocuments } from '@/lib/services/ai/ragService';
import { auth } from '@/lib/auth';
import { unauthorized } from '@/lib/api/errors';
import { z } from 'zod';

const SearchSchema = z.object({
  query: z.string().min(1).max(500),
  limit: z.number().int().min(1).max(20).optional(),
});

/**
 * GET /api/ai/rag — Statistiques d'indexation (auth requise).
 */
export const GET = withErrorHandler(async (_req: NextRequest) => {
  const session = await auth();
  if (!session?.user) throw unauthorized();

  const stats = await getIndexStats();
  return ApiResponse.success({
    indexed: stats.total > 0,
    total:   stats.total,
    byType:  stats.byType,
  });
});

/**
 * POST /api/ai/rag — Recherche par similarité (auth requise).
 * Body: { query: string, limit?: number }
 */
export const POST = withErrorHandler(
  withValidation(SearchSchema, async (_req: NextRequest, ctx) => {
    const session = await auth();
    if (!session?.user) throw unauthorized();

    const documents = await searchSimilarDocuments(ctx.data.query, ctx.data.limit ?? 5);
    return ApiResponse.success({ documents, count: documents.length });
  }),
);
