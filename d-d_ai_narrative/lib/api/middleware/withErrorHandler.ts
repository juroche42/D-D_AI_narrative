import type { NextRequest, NextResponse } from 'next/server';
import { AppError } from '@/lib/api/errors';
import * as ApiResponse from '@/lib/api/response';

type RouteHandler = (req: NextRequest) => Promise<NextResponse>;

export function withErrorHandler(handler: RouteHandler): RouteHandler {
  return async (req: NextRequest): Promise<NextResponse> => {
    const requestId = req.headers.get('x-request-id') ?? undefined;

    try {
      return await handler(req);
    } catch (err) {
      if (err instanceof AppError) {
        return ApiResponse.error(err, requestId);
      }

      if (err instanceof Error) {
        console.error(`[withErrorHandler] Unhandled error: ${err.message}`, err);

        const details =
          process.env.NODE_ENV !== 'production'
            ? { stack: err.stack, message: err.message }
            : undefined;

        const serverError = new AppError(
          'An unexpected error occurred',
          'INTERNAL_SERVER_ERROR',
          500,
          details,
        );

        return ApiResponse.error(serverError, requestId);
      }

      console.error('[withErrorHandler] Unknown thrown value:', err);
      return ApiResponse.error(undefined, requestId);
    }
  };
}
