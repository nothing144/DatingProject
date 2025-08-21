/**
 * Image utilities - Updated to use Cloudinary instead of Supabase Storage
 * 
 * MIGRATION NOTE: This file now imports functions from cloudinaryUtils.ts
 * to maintain backward compatibility while using Cloudinary for better performance
 */

import { 
  getOptimizedCloudinaryUrl,
  getCloudinaryThumbnailUrl, 
  getCloudinaryHighQualityUrl,
  getCloudinaryFallbackAvatarUrl,
  isCloudinaryUrl,
  extractPublicIdFromUrl
} from './cloudinaryUtils';

export interface CompressedImage {
  file: File;
  preview: string;
  size: number;
}

/**
 * Compress an image file to under the specified size limit
 */
export const compressImage = async (
  file: File, 
  maxSizeKB: number = 100,
  quality: number = 0.8,
  maxWidth: number = 800,
  maxHeight: number = 800
): Promise<CompressedImage> => {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      // Calculate new dimensions while maintaining aspect ratio
      let { width, height } = img;
      
      if (width > height) {
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width = (width * maxHeight) / height;
          height = maxHeight;
        }
      }

      canvas.width = width;
      canvas.height = height;

      // Draw and compress
      if (ctx) {
        ctx.drawImage(img, 0, 0, width, height);
        
        // Try different quality levels to get under size limit
        let currentQuality = quality;
        let attempts = 0;
        const maxAttempts = 10;
        
        const tryCompress = () => {
          canvas.toBlob((blob) => {
            if (!blob) {
              reject(new Error('Failed to compress image'));
              return;
            }

            const sizeKB = blob.size / 1024;
            
            if (sizeKB <= maxSizeKB || attempts >= maxAttempts) {
              // Success or max attempts reached
              const compressedFile = new File([blob], file.name, {
                type: blob.type,
                lastModified: Date.now()
              });
              
              resolve({
                file: compressedFile,
                preview: canvas.toDataURL(blob.type, currentQuality),
                size: Math.round(sizeKB)
              });
            } else {
              // Try with lower quality
              attempts++;
              currentQuality = Math.max(0.1, currentQuality - 0.1);
              tryCompress();
            }
          }, file.type, currentQuality);
        };
        
        tryCompress();
      } else {
        reject(new Error('Canvas context not available'));
      }
    };

    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = URL.createObjectURL(file);
  });
};

/**
 * Generate optimized image URL - Updated to use Cloudinary
 * Now supports both legacy Supabase URLs and new Cloudinary URLs
 */
export const getOptimizedImageUrl = (
  originalUrl: string,
  options: {
    width?: number;
    height?: number;
    quality?: number | 'auto';
    format?: 'webp' | 'jpg' | 'png' | 'auto';
    resize?: 'cover' | 'contain' | 'fill';
  } = {}
): string => {
  if (!originalUrl) return '';

  // If it's a Cloudinary URL, use Cloudinary optimization
  if (isCloudinaryUrl(originalUrl)) {
    const publicId = extractPublicIdFromUrl(originalUrl);
    if (publicId) {
      return getOptimizedCloudinaryUrl(publicId, {
        width: options.width,
        height: options.height,
        quality: options.quality || 'auto',
        format: options.format || 'auto',
        crop: options.resize === 'cover' ? 'fill' : 'fit'
      });
    }
  }

  // Legacy support for non-Cloudinary URLs (fallback)
  if (originalUrl.includes('supabase')) {
    console.warn('Supabase storage URL detected. Consider migrating to Cloudinary for better performance.');
    // Return original URL for legacy Supabase images
    return originalUrl;
  }

  // Return original URL if not recognized
  return originalUrl;
};

/**
 * Get thumbnail version of image - Updated to use Cloudinary
 */
export const getThumbnailUrl = (originalUrl: string): string => {
  if (!originalUrl) return '';
  
  // Use Cloudinary thumbnail if it's a Cloudinary URL
  if (isCloudinaryUrl(originalUrl)) {
    const publicId = extractPublicIdFromUrl(originalUrl);
    if (publicId) {
      return getCloudinaryThumbnailUrl(publicId);
    }
  }
  
  // Fallback to optimized URL for non-Cloudinary images
  return getOptimizedImageUrl(originalUrl, {
    width: 300,
    height: 300,
    quality: 70,
    format: 'webp',
    resize: 'cover'
  });
};

/**
 * Get high quality version of image - Updated to use Cloudinary
 */
export const getHighQualityUrl = (originalUrl: string): string => {
  if (!originalUrl) return '';
  
  // Use Cloudinary high quality if it's a Cloudinary URL
  if (isCloudinaryUrl(originalUrl)) {
    const publicId = extractPublicIdFromUrl(originalUrl);
    if (publicId) {
      return getCloudinaryHighQualityUrl(publicId);
    }
  }
  
  // Fallback to optimized URL for non-Cloudinary images
  return getOptimizedImageUrl(originalUrl, {
    width: 800,
    height: 800,
    quality: 85,
    format: 'webp',
    resize: 'cover'
  });
};

/**
 * Validate image file before compression
 */
export const validateImageFile = (file: File): { valid: boolean; error?: string } => {
  const maxSize = 10 * 1024 * 1024; // 10MB max before compression
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  
  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: 'Please select a valid image file (JPEG, PNG, or WebP)'
    };
  }
  
  if (file.size > maxSize) {
    return {
      valid: false,
      error: 'Image file is too large. Please select an image under 10MB.'
    };
  }
  
  return { valid: true };
};

/**
 * Create fallback avatar URL
 */
export const getFallbackAvatarUrl = (name: string, size: number = 400): string => {
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=6366f1&color=fff&size=${size}&format=png`;
};