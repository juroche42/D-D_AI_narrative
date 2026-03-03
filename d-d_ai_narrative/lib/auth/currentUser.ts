import type { NextRequest } from 'next/server';
import { unauthorized } from '@/lib/api/errors';
import { auth } from '@/lib/auth';

/**
 * Primary source: NextAuth session.
 * Fallback: X-User-Id header for existing API tests/dev flows.
 */
export async function requireCurrentUserId(req: NextRequest): Promise<string> {
  const session = await auth();
  const sessionUserId = session?.user?.id;

  if (sessionUserId) {
    return sessionUserId;
  }

  const headerUserId = req.headers.get('x-user-id');

  if (headerUserId) {
    return headerUserId;
  }

  throw unauthorized('Missing authentication context');
}
