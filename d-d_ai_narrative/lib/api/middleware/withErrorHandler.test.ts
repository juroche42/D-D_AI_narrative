import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock ApiResponse — isole withErrorHandler de next/server
vi.mock('@/lib/api/response', () => ({
  error: vi.fn().mockReturnValue({ status: 500, _tag: 'error-response' }),
  success: vi.fn().mockReturnValue({ status: 200, _tag: 'success-response' }),
  created: vi.fn(),
  paginated: vi.fn(),
}));

import { withErrorHandler } from './withErrorHandler';
import { AppError } from '@/lib/api/errors';
import * as ApiResponse from '@/lib/api/response';
import type { NextRequest, NextResponse } from 'next/server';

// Minimal mock de NextRequest — seul headers.get() est utilisé par withErrorHandler
const makeReq = (requestId?: string) =>
  ({
    headers: {
      get: vi.fn().mockImplementation((key: string) =>
        key === 'x-request-id' ? (requestId ?? null) : null,
      ),
    },
  }) as unknown as NextRequest;

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(ApiResponse.error).mockReturnValue({ status: 500 } as unknown as NextResponse);
});

// ─────────────────────────────────────────────────────────────────────────────

describe('withErrorHandler', () => {
  it('retourne la réponse du handler si aucune exception', async () => {
    const mockResponse = { status: 200 } as unknown as NextResponse;
    const handler = vi.fn().mockResolvedValue(mockResponse);

    const result = await withErrorHandler(handler)(makeReq());

    expect(result).toBe(mockResponse);
    expect(ApiResponse.error).not.toHaveBeenCalled();
  });

  it('attrape AppError et appelle ApiResponse.error avec l\'erreur', async () => {
    const appError = new AppError('Not found', 'NOT_FOUND', 404);
    const handler = vi.fn().mockRejectedValue(appError);

    await withErrorHandler(handler)(makeReq());

    expect(ApiResponse.error).toHaveBeenCalledWith(appError, undefined);
  });

  it('attrape Error générique et retourne une erreur 500', async () => {
    const handler = vi.fn().mockRejectedValue(new Error('Database crashed'));

    await withErrorHandler(handler)(makeReq());

    // ApiResponse.error est appelé avec une AppError 500 générée en interne
    const callArg = vi.mocked(ApiResponse.error).mock.calls[0][0] as AppError;
    expect(callArg).toBeInstanceOf(AppError);
    expect(callArg.statusCode).toBe(500);
    expect(callArg.code).toBe('INTERNAL_SERVER_ERROR');
  });

  it('attrape une valeur inconnue (non-Error) et retourne 500', async () => {
    const handler = vi.fn().mockImplementation(() => {
      // eslint-disable-next-line @typescript-eslint/no-throw-literal
      throw 'something unexpected';
    });

    await withErrorHandler(handler)(makeReq());

    expect(ApiResponse.error).toHaveBeenCalledWith(undefined, undefined);
  });

  it('transmet x-request-id à ApiResponse.error', async () => {
    const appError = new AppError('Forbidden', 'FORBIDDEN', 403);
    const handler = vi.fn().mockRejectedValue(appError);

    await withErrorHandler(handler)(makeReq('req-uuid-42'));

    expect(ApiResponse.error).toHaveBeenCalledWith(appError, 'req-uuid-42');
  });
});
