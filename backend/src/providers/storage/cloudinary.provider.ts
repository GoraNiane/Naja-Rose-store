import { cloudinary } from '../../config/cloudinary.js';
import { env } from '../../config/env.js';
import { logger } from '../../utils/logger.js';
import { ApiError } from '../../utils/apiError.js';

export class CloudinaryProvider {
  async uploadImage(base64OrPath: string, folder = 'naja_store/products') {
    // If Cloudinary keys are not set or are mock keys in dev, provide an immediate optimized payload
    const isConfigured = Boolean(
      env.CLOUDINARY_CLOUD_NAME &&
        env.CLOUDINARY_API_KEY &&
        env.CLOUDINARY_API_SECRET &&
        !env.CLOUDINARY_API_KEY.includes('1234567890')
    );

    if (!isConfigured) {
      logger.info('[Cloudinary] Using local development fallback image storage');
      // If base64 or URL passed, return a usable optimized URL format
      const isDataUrl = base64OrPath.startsWith('data:image');
      const mockPublicId = `naja_dev_${Date.now()}_${Math.random().toString(36).substring(7)}`;
      return {
        url: isDataUrl
          ? base64OrPath // data URL works directly in browser
          : base64OrPath.startsWith('http')
          ? base64OrPath
          : 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?auto=format&fit=crop&w=1000&q=80',
        publicId: mockPublicId,
        format: 'webp',
        width: 1200,
        height: 1200,
      };
    }

    try {
      const result = await cloudinary.uploader.upload(base64OrPath, {
        folder,
        resource_type: 'image',
        transformation: [
          { width: 1200, height: 1200, crop: 'limit' },
          { quality: 'auto:good' },
          { fetch_format: 'auto' },
        ],
      });

      return {
        url: result.secure_url,
        publicId: result.public_id,
        format: result.format,
        width: result.width,
        height: result.height,
      };
    } catch (error) {
      logger.error('Cloudinary upload failed:', error);
      throw ApiError.badRequest('Échec du téléversement de l\'image sur Cloudinary');
    }
  }

  async deleteImage(publicId: string) {
    if (publicId.startsWith('naja_dev_')) {
      return true;
    }
    try {
      await cloudinary.uploader.destroy(publicId);
      return true;
    } catch (error) {
      logger.error('Cloudinary delete failed:', error);
      return false;
    }
  }
}

export const cloudinaryProvider = new CloudinaryProvider();
