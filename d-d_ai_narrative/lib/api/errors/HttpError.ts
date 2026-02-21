import { AppError, ErrorCode } from './AppError';

/** 400 Bad Request — données invalides ou validation échouée. */
export function badRequest(message: string, details?: unknown): AppError {
  return new AppError(message, ErrorCode.VALIDATION_ERROR, 400, details);
}

/** 401 Unauthorized — authentification requise ou token invalide. */
export function unauthorized(message = 'Authentication required'): AppError {
  return new AppError(message, ErrorCode.UNAUTHORIZED, 401);
}

/** 403 Forbidden — authentifié mais sans les permissions requises. */
export function forbidden(message = 'Access denied'): AppError {
  return new AppError(message, ErrorCode.FORBIDDEN, 403);
}

/** 404 Not Found — ressource introuvable. */
export function notFound(resource: string): AppError {
  return new AppError(`${resource} not found`, ErrorCode.NOT_FOUND, 404);
}

/** 409 Conflict — conflit avec l'état actuel (ex: doublon). */
export function conflict(message: string): AppError {
  return new AppError(message, ErrorCode.CONFLICT, 409);
}

/** 501 Not Implemented — endpoint prévu mais pas encore développé. */
export function notImplemented(message = 'Not implemented yet'): AppError {
  return new AppError(message, ErrorCode.NOT_IMPLEMENTED, 501);
}

/** 500 Internal Server Error — erreur serveur inattendue. */
export function internalServer(message = 'An unexpected error occurred'): AppError {
  return new AppError(message, ErrorCode.INTERNAL_SERVER_ERROR, 500);
}
