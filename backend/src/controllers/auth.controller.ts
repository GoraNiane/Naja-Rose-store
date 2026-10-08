import { Request, Response, NextFunction } from 'express';
import { authService } from '../services/auth.service.js';
import { ApiResponse } from '../utils/apiResponse.js';
import { userRepository } from '../repositories/user.repository.js';
import { ApiError } from '../utils/apiError.js';

export class AuthController {
  static async register(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await authService.register(req.body);
      return ApiResponse.created(res, result, 'Compte utilisateur créé avec succès');
    } catch (error) {
      return next(error);
    }
  }

  static async login(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await authService.login(req.body);
      return ApiResponse.success(res, result, 'Connexion réussie');
    } catch (error) {
      return next(error);
    }
  }

  static async adminLogin(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await authService.adminLogin(req.body.password);
      return ApiResponse.success(res, result, 'Connexion administrateur réussie');
    } catch (error) {
      return next(error);
    }
  }

  static async getMe(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw ApiError.unauthorized('Non authentifié');
      }

      if (req.user.userId === 'admin-default-id' || req.user.role === 'ADMIN') {
        return ApiResponse.success(res, {
          id: req.user.userId,
          email: req.user.email || 'admin@najarosestore.sn',
          firstName: 'Directrice',
          lastName: 'Naja Rose',
          phone: '+221770000001',
          role: 'ADMIN',
          customer: null,
        });
      }

      const user = await userRepository.findById(req.user.userId);
      if (!user) {
        throw ApiError.notFound('Utilisateur non trouvé');
      }

      return ApiResponse.success(res, {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        role: user.role,
        customer: user.customer,
      });
    } catch (error) {
      return next(error);
    }
  }
}
