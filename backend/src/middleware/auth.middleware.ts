import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { ApiError } from '../utils/apiError.js';
import { Role, UserPayload } from '../types/index.js';

export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(ApiError.unauthorized('Token d\'authentification manquant', 'AUTH_TOKEN_MISSING'));
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as UserPayload;
    req.user = decoded;
    return next();
  } catch {
    return next(ApiError.unauthorized('Token expiré ou invalide', 'INVALID_TOKEN'));
  }
}

export function requireRole(...roles: Role[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(ApiError.unauthorized('Utilisateur non authentifié', 'UNAUTHENTICATED'));
    }

    if (!roles.includes(req.user.role)) {
      return next(ApiError.forbidden('Accès refusé : privilèges administrateur requis', 'FORBIDDEN'));
    }

    return next();
  };
}

export const requireAdmin = requireRole(Role.ADMIN);

// Aliases for compatibility
export const authenticate = requireAuth;
export const authorize = requireRole;
