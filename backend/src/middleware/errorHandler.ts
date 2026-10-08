import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../utils/apiError.js';
import { logger } from '../utils/logger.js';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction
) {
  logger.error(`[Error] ${req.method} ${req.path} - ${err.message}`);

  // 1. Handled Custom ApiError
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      code: err.code,
      errors: err.errors || undefined,
    });
  }

  // 2. Zod Validation Error
  if (err instanceof ZodError) {
    const formattedErrors = err.errors.map((e) => ({
      field: e.path.join('.').replace(/^(body|query|params)\./, ''),
      message: e.message,
    }));
    return res.status(400).json({
      success: false,
      message: 'Erreur de validation des données fournies',
      code: 'VALIDATION_ERROR',
      errors: formattedErrors,
    });
  }

  // 3. Prisma Known Request Errors
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      const target = (err.meta?.target as string[]) || [];
      return res.status(409).json({
        success: false,
        message: `Une entrée avec ces identifiants (${target.join(', ')}) existe déjà`,
        code: 'UNIQUE_CONSTRAINT_VIOLATION',
      });
    }
    if (err.code === 'P2025') {
      return res.status(404).json({
        success: false,
        message: 'L\'enregistrement cible est introuvable',
        code: 'NOT_FOUND',
      });
    }
  }

  // 4. JWT Authentication Errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: 'Token d\'authentification invalide',
      code: 'INVALID_TOKEN',
    });
  }
  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      message: 'Le token d\'authentification a expiré',
      code: 'TOKEN_EXPIRED',
    });
  }

  // 5. Unhandled Internal Server Errors (No stack trace exposed)
  const isProduction = process.env.NODE_ENV === 'production';
  return res.status(500).json({
    success: false,
    message: isProduction ? 'Une erreur interne est survenue sur le serveur' : err.message,
    code: 'INTERNAL_SERVER_ERROR',
  });
}
