import { describe, it, expect } from 'vitest';
import { AppError, ErrorCode } from './AppError';
import {
  badRequest,
  unauthorized,
  forbidden,
  notFound,
  conflict,
  notImplemented,
  internalServer,
} from './HttpError';

// ─── AppError ────────────────────────────────────────────────────────────────

describe('AppError', () => {
  it('assigne message, code, statusCode et details', () => {
    const err = new AppError('oops', 'NOT_FOUND', 404, { field: 'id' });
    expect(err.message).toBe('oops');
    expect(err.code).toBe('NOT_FOUND');
    expect(err.statusCode).toBe(404);
    expect(err.details).toEqual({ field: 'id' });
  });

  it('name est "AppError"', () => {
    const err = new AppError('x', 'CONFLICT', 409);
    expect(err.name).toBe('AppError');
  });

  it('est instanceof AppError ET instanceof Error', () => {
    const err = new AppError('x', 'CONFLICT', 409);
    expect(err).toBeInstanceOf(AppError);
    expect(err).toBeInstanceOf(Error);
  });

  it('details est undefined si non fourni', () => {
    const err = new AppError('x', 'CONFLICT', 409);
    expect(err.details).toBeUndefined();
  });

  it('toJSON() retourne la structure complète', () => {
    const err = new AppError('msg', 'FORBIDDEN', 403, { hint: 'try again' });
    expect(err.toJSON()).toEqual({
      name: 'AppError',
      message: 'msg',
      code: 'FORBIDDEN',
      statusCode: 403,
      details: { hint: 'try again' },
    });
  });

  it('toJSON() inclut details: undefined si absent', () => {
    const err = new AppError('msg', 'FORBIDDEN', 403);
    expect(err.toJSON()).toMatchObject({ details: undefined });
  });
});

// ─── HttpError factories ─────────────────────────────────────────────────────

describe('badRequest', () => {
  it('retourne 400 avec code VALIDATION_ERROR', () => {
    const err = badRequest('données invalides');
    expect(err).toBeInstanceOf(AppError);
    expect(err.statusCode).toBe(400);
    expect(err.code).toBe(ErrorCode.VALIDATION_ERROR);
    expect(err.message).toBe('données invalides');
  });

  it('propage les details', () => {
    const details = { fieldErrors: { username: ['trop court'] } };
    const err = badRequest('validation failed', details);
    expect(err.details).toEqual(details);
  });
});

describe('unauthorized', () => {
  it('retourne 401 avec code UNAUTHORIZED', () => {
    const err = unauthorized();
    expect(err.statusCode).toBe(401);
    expect(err.code).toBe(ErrorCode.UNAUTHORIZED);
  });

  it('message par défaut "Authentication required"', () => {
    expect(unauthorized().message).toBe('Authentication required');
  });

  it('accepte un message personnalisé', () => {
    expect(unauthorized('Token expiré').message).toBe('Token expiré');
  });
});

describe('forbidden', () => {
  it('retourne 403 avec code FORBIDDEN', () => {
    const err = forbidden();
    expect(err.statusCode).toBe(403);
    expect(err.code).toBe(ErrorCode.FORBIDDEN);
  });

  it('message par défaut "Access denied"', () => {
    expect(forbidden().message).toBe('Access denied');
  });
});

describe('notFound', () => {
  it('retourne 404 avec code NOT_FOUND', () => {
    const err = notFound('User');
    expect(err.statusCode).toBe(404);
    expect(err.code).toBe(ErrorCode.NOT_FOUND);
  });

  it('message au format "{resource} not found"', () => {
    expect(notFound('Character').message).toBe('Character not found');
  });
});

describe('conflict', () => {
  it('retourne 409 avec code CONFLICT', () => {
    const err = conflict('Ce pseudo est déjà utilisé');
    expect(err.statusCode).toBe(409);
    expect(err.code).toBe(ErrorCode.CONFLICT);
    expect(err.message).toBe('Ce pseudo est déjà utilisé');
  });
});

describe('notImplemented', () => {
  it('retourne 501 avec code NOT_IMPLEMENTED', () => {
    const err = notImplemented();
    expect(err.statusCode).toBe(501);
    expect(err.code).toBe(ErrorCode.NOT_IMPLEMENTED);
  });

  it('message par défaut "Not implemented yet"', () => {
    expect(notImplemented().message).toBe('Not implemented yet');
  });
});

describe('internalServer', () => {
  it('retourne 500 avec code INTERNAL_SERVER_ERROR', () => {
    const err = internalServer();
    expect(err.statusCode).toBe(500);
    expect(err.code).toBe(ErrorCode.INTERNAL_SERVER_ERROR);
  });

  it('message par défaut "An unexpected error occurred"', () => {
    expect(internalServer().message).toBe('An unexpected error occurred');
  });
});
