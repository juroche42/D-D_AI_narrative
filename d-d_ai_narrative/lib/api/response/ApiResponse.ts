import { NextResponse } from 'next/server';
import { AppError, internalServer } from '@/lib/api/errors';

interface ResponseMeta {
  timestamp: string;
  requestId?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ApiResponseBody<T> {
  success: boolean;
  data: T | null;
  message: string;
  error: { code: string; details?: unknown } | null;
  meta: ResponseMeta;
}

function buildMeta(extra?: Partial<ResponseMeta>): ResponseMeta {
  return {
    timestamp: new Date().toISOString(),
    ...extra,
  };
}

export function success<T>(
  data: T,
  message = 'Success',
  meta?: Partial<ResponseMeta>,
): NextResponse<ApiResponseBody<T>> {
  return NextResponse.json(
    { success: true, data, message, error: null, meta: buildMeta(meta) },
    { status: 200 },
  );
}

export function created<T>(
  data: T,
  message = 'Resource created successfully',
): NextResponse<ApiResponseBody<T>> {
  return NextResponse.json(
    { success: true, data, message, error: null, meta: buildMeta() },
    { status: 201 },
  );
}

export function error(
  err: unknown,
  requestId?: string,
): NextResponse<ApiResponseBody<null>> {
  const appError = err instanceof AppError ? err : internalServer();

  return NextResponse.json(
    {
      success: false,
      data: null,
      message: appError.message,
      error: { code: appError.code, details: appError.details },
      meta: buildMeta({ requestId }),
    },
    { status: appError.statusCode },
  );
}

export function paginated<T>(
  data: T[],
  total: number,
  page: number,
  limit: number,
): NextResponse<ApiResponseBody<T[]>> {
  const totalPages = Math.ceil(total / limit);

  return NextResponse.json(
    {
      success: true,
      data,
      message: 'Success',
      error: null,
      meta: buildMeta({ pagination: { page, limit, total, totalPages } }),
    },
    { status: 200 },
  );
}
