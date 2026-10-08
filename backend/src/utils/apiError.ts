export class ApiError extends Error {
  public statusCode: number;
  public code: string;
  public errors?: unknown;
  public isOperational: boolean;

  constructor(
    statusCode: number,
    message: string,
    code = 'ERROR',
    errors?: unknown,
    isOperational = true
  ) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.errors = errors;
    this.isOperational = isOperational;
    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(message: string, errors?: unknown, code = 'BAD_REQUEST') {
    return new ApiError(400, message, code, errors);
  }

  static unauthorized(message = 'Accès non autorisé', code = 'UNAUTHORIZED') {
    return new ApiError(401, message, code);
  }

  static forbidden(message = 'Accès interdit : droits insuffisants', code = 'FORBIDDEN') {
    return new ApiError(403, message, code);
  }

  static notFound(message = 'Ressource introuvable', code = 'NOT_FOUND') {
    return new ApiError(404, message, code);
  }

  static conflict(message: string, code = 'CONFLICT') {
    return new ApiError(409, message, code);
  }

  static internal(message = 'Erreur interne du serveur', code = 'INTERNAL_ERROR') {
    return new ApiError(500, message, code, undefined, false);
  }
}
