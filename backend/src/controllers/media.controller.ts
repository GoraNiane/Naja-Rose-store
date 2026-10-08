import { Request, Response, NextFunction } from 'express';
import { cloudinaryProvider } from '../providers/storage/cloudinary.provider.js';
import { ApiResponse } from '../utils/apiResponse.js';
import { ApiError } from '../utils/apiError.js';

export class MediaController {
  static async upload(req: Request, res: Response, next: NextFunction) {
    try {
      const { image, folder } = req.body;
      if (!image || typeof image !== 'string') {
        throw ApiError.badRequest('Le champ "image" (base64 data-uri ou URL) est obligatoire');
      }

      const result = await cloudinaryProvider.uploadImage(image, folder || 'naja_store/products');
      return ApiResponse.created(res, result, 'Image téléversée et optimisée avec succès');
    } catch (error) {
      return next(error);
    }
  }

  static async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const publicId = String(req.params.publicId);
      const success = await cloudinaryProvider.deleteImage(publicId);
      return ApiResponse.success(res, { success }, 'Image supprimée');
    } catch (error) {
      return next(error);
    }
  }
}
