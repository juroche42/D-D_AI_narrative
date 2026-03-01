import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock NextResponse.json : capture (body, init) et retourne un objet testable
vi.mock('next/server', () => ({
  NextResponse: {
    json: vi.fn().mockImplementation((body: unknown, init?: { status?: number }) => ({
      status: init?.status ?? 200,
      json: () => Promise.resolve(body),
    })),
  },
}));

import { success, created, error, paginated } from './ApiResponse';
import { AppError } from '@/lib/api/errors';
import { NextResponse } from 'next/server';

const mockNextResponseJson = vi.mocked(NextResponse.json);

beforeEach(() => {
  vi.clearAllMocks();
  mockNextResponseJson.mockImplementation(((body: unknown, init?: { status?: number }) => ({
    status: init?.status ?? 200,
    json: () => Promise.resolve(body),
  })) as unknown as typeof NextResponse.json);
});

// ─── success ─────────────────────────────────────────────────────────────────

describe('success', () => {
  it('status 200, success:true, data correct', async () => {
    const res = success({ id: 42 }, 'ok');
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data).toEqual({ id: 42 });
    expect(body.error).toBeNull();
  });

  it('message par défaut "Success"', async () => {
    const res = success(null);
    const body = await res.json();
    expect(body.message).toBe('Success');
  });

  it('meta.timestamp est une string ISO', async () => {
    const res = success({});
    const body = await res.json();
    expect(typeof body.meta.timestamp).toBe('string');
    expect(() => new Date(body.meta.timestamp)).not.toThrow();
  });
});

// ─── created ─────────────────────────────────────────────────────────────────

describe('created', () => {
  it('status 201, success:true', async () => {
    const res = created({ id: 'new' });
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data).toEqual({ id: 'new' });
  });

  it('message par défaut "Resource created successfully"', async () => {
    const res = created({});
    const body = await res.json();
    expect(body.message).toBe('Resource created successfully');
  });
});

// ─── error ───────────────────────────────────────────────────────────────────

describe('error', () => {
  it('AppError → status correct + error.code correct', async () => {
    const appError = new AppError('Ce pseudo est déjà utilisé', 'CONFLICT', 409);
    const res = error(appError);
    expect(res.status).toBe(409);
    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.data).toBeNull();
    expect(body.error.code).toBe('CONFLICT');
    expect(body.message).toBe('Ce pseudo est déjà utilisé');
  });

  it('non-AppError → status 500 et code INTERNAL_SERVER_ERROR', async () => {
    const res = error(new Error('boom'));
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error.code).toBe('INTERNAL_SERVER_ERROR');
  });

  it('undefined → status 500 (fallback internalServer)', async () => {
    const res = error(undefined);
    expect(res.status).toBe(500);
  });

  it('requestId est propagé dans meta', async () => {
    const appError = new AppError('x', 'NOT_FOUND', 404);
    const res = error(appError, 'req-abc-123');
    const body = await res.json();
    expect(body.meta.requestId).toBe('req-abc-123');
  });
});

// ─── paginated ────────────────────────────────────────────────────────────────

describe('paginated', () => {
  it('status 200, success:true, data array', async () => {
    const res = paginated([{ id: 1 }, { id: 2 }], 20, 1, 10);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data).toHaveLength(2);
  });

  it('meta.pagination contient page, limit, total, totalPages', async () => {
    const res = paginated([], 55, 2, 20);
    const body = await res.json();
    expect(body.meta.pagination).toEqual({
      page: 2,
      limit: 20,
      total: 55,
      totalPages: 3, // ceil(55/20) = 3
    });
  });
});
