/**
 * Image compression utilities for optimizing profile images
 */

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
 * Generate optimized image URL using Supabase image transformations
 */
export const getOptimizedImageUrl = (
  originalUrl: string,
  options: {
    width?: number;
    height?: number;
    quality?: number;
    format?: 'webp' | 'jpg' | 'png';
    resize?: 'cover' | 'contain' | 'fill';
  } = {}
): string => {
  if (!originalUrl || !originalUrl.includes('supabase')) {
    // Return original URL if not a Supabase URL
    return originalUrl;
  }

  const {
    width = 400,
    height = 400,
    quality = 80,
    format = 'webp',
    resize = 'cover'
  } = options;

  // Build Supabase image transformation URL
  const baseUrl = originalUrl.split('?')[0]; // Remove existing query params
  const transformParams = new URLSearchParams();
  
  transformParams.set('width', width.toString());
  transformParams.set('height', height.toString());
  transformParams.set('quality', quality.toString());
  transformParams.set('format', format);
  transformParams.set('resize', resize);

  return `${baseUrl}?${transformParams.toString()}`;
};

/**
 * Get thumbnail version of image for grid view
 */
export const getThumbnailUrl = (originalUrl: string): string => {
  return getOptimizedImageUrl(originalUrl, {
    width: 300,
    height: 300,
    quality: 70,
    format: 'webp',
    resize: 'cover'
  });
};

/**
 * Get high quality version of image for single profile view
 */
export const getHighQualityUrl = (originalUrl: string): string => {
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