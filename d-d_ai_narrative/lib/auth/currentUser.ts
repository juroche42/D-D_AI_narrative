import type { NextRequest } from 'next/server';
import { unauthorized } from '@/lib/api/errors';

/**
 * Temporary auth extractor used until NextAuth is wired.
 * We rely on X-User-Id passed by the client/tests.
 */
export function requireCurrentUserId(req: NextRequest): string {
  const userId = req.headers.get('x-user-id');

  if (!userId) {
    throw unauthorized('Missing authentication context (x-user-id header)');
  }

  return userId;
}
