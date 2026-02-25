import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock ApiResponse — isole withValidation de next/server
vi.mock('@/lib/api/response', () => ({
  error: vi.fn().mockReturnValue({ status: 400, _tag: 'error-response' }),
  success: vi.fn(),
  created: vi.fn(),
  paginated: vi.fn(),
}));

import { withValidation } from './withValidation';
import * as ApiResponse from '@/lib/api/response';
import { z } from 'zod';
import type { NextRequest, NextResponse } from 'next/server';

// Schéma simple pour les tests
const TestSchema = z.object({
  name: z.string().min(3, 'Trop court'),
  value: z.number(),
});

// Crée un mock de NextRequest avec req.json() contrôlable
const makeReq = (body: unknown, throwJsonError = false) =>
  ({
    json: throwJsonError
      ? vi.fn().mockRejectedValue(new SyntaxError('Unexpected token'))
      : vi.fn().mockResolvedValue(body),
  }) as unknown as NextRequest;

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(ApiResponse.error).mockReturnValue({ status: 400 } as unknown as NextResponse);
});

// ─────────────────────────────────────────────────────────────────────────────

describe('withValidation', () => {
  it('JSON valide + schema OK → appelle le handler avec data parsée', async () => {
    const handler = vi.fn().mockResolvedValue({ status: 200 } as unknown as NextResponse);
    const req = makeReq({ name: 'Alice', value: 42 });

    await withValidation(TestSchema, handler)(req);

    expect(handler).toHaveBeenCalledWith(req, { data: { name: 'Alice', value: 42 } });
    expect(ApiResponse.error).not.toHaveBeenCalled();
  });

  it('JSON malformé → 400 "Invalid JSON body"', async () => {
    const handler = vi.fn();
    const req = makeReq(null, /* throwJsonError */ true);

    await withValidation(TestSchema, handler)(req);

    expect(handler).not.toHaveBeenCalled();
    expect(ApiResponse.error).toHaveBeenCalledOnce();
    const errArg = vi.mocked(ApiResponse.error).mock.calls[0][0] as {
      statusCode: number;
      message: string;
    };
    expect(errArg.statusCode).toBe(400);
    expect(errArg.message).toBe('Invalid JSON body');
  });

  it('JSON valide mais schema KO → 400 "Validation failed" avec fieldErrors', async () => {
    const handler = vi.fn();
    // name trop court, value manquant
    const req = makeReq({ name: 'AB' });

    await withValidation(TestSchema, handler)(req);

    expect(handler).not.toHaveBeenCalled();
    expect(ApiResponse.error).toHaveBeenCalledOnce();

    const errArg = vi.mocked(ApiResponse.error).mock.calls[0][0] as {
      statusCode: number;
      message: string;
      details: { fieldErrors: Record<string, string[]> };
    };
    expect(errArg.statusCode).toBe(400);
    expect(errArg.message).toBe('Validation failed');
    expect(errArg.details).toHaveProperty('fieldErrors');
    expect(errArg.details.fieldErrors).toHaveProperty('name');
  });
});
