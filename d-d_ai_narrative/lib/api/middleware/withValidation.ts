import type { NextRequest, NextResponse } from 'next/server';
import { ZodSchema, ZodError } from 'zod';
import { badRequest } from '@/lib/api/errors';
import * as ApiResponse from '@/lib/api/response';

export interface ValidationContext<T> {
  data: T;
}

type ValidatedHandler<T> = (
  req: NextRequest,
  ctx: ValidationContext<T>,
) => Promise<NextResponse>;

export function withValidation<T>(
  schema: ZodSchema<T>,
  handler: ValidatedHandler<T>,
): (req: NextRequest) => Promise<NextResponse> {
  return async (req: NextRequest): Promise<NextResponse> => {
    let body: unknown;

    try {
      body = await req.json();
    } catch {
      return ApiResponse.error(badRequest('Invalid JSON body'));
    }

    const result = schema.safeParse(body);

    if (!result.success) {
      const formatted = (result.error as ZodError).flatten();
      return ApiResponse.error(badRequest('Validation failed', formatted));
    }

    return handler(req, { data: result.data });
  };
}
