/**
 * Image utilities - Pure compression without transformations
 * 
 * This file provides image compression functionality that keeps images under 100KB
 * and serves original URLs without any post-upload transformations
 */

// Helper function for basic URL validation
const isValidImageUrl = (url: string): boolean => {
  if (!url) return false;
  
  // Check if it's a valid URL format
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

const getFallbackAvatarUrl = (name: string, size: number = 400): string => {
  const initial = name.charAt(0).toUpperCase();
  return `https://ui-avatars.com/api/?name=${initial}&size=${size}&background=random`;
};

export interface CompressedImage {
  file: File;
  preview: string;
  size: number;
}

/**
 * Compress an image file to under the specified size limit
 * Enhanced with multi-stage compression and dimension reduction
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
      // Calculate initial dimensions while maintaining aspect ratio
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

      if (!ctx) {
        reject(new Error('Canvas context not available'));
        return;
      }

      // Multi-stage compression approach
      let currentWidth = width;
      let currentHeight = height;
      let currentQuality = quality;
      let attempts = 0;
      const maxAttempts = 20; // Increased max attempts
      
      const tryCompress = () => {
        // Set canvas dimensions
        canvas.width = currentWidth;
        canvas.height = currentHeight;
        
        // Clear canvas and draw image
        ctx.clearRect(0, 0, currentWidth, currentHeight);
        ctx.drawImage(img, 0, 0, currentWidth, currentHeight);
        
        canvas.toBlob((blob) => {
          if (!blob) {
            reject(new Error('Failed to compress image'));
            return;
          }

          const sizeKB = blob.size / 1024;
          
          console.log(`🖼️ Compression attempt ${attempts + 1}: ${Math.round(sizeKB)}KB (target: ${maxSizeKB}KB) - Quality: ${currentQuality.toFixed(2)}, Dimensions: ${currentWidth}x${currentHeight}`);
          
          if (sizeKB <= maxSizeKB || attempts >= maxAttempts) {
            // Success or max attempts reached
            const compressedFile = new File([blob], file.name, {
              type: blob.type,
              lastModified: Date.now()
            });
            
            // Final validation - if still over size limit, try one more aggressive compression
            if (sizeKB > maxSizeKB && attempts < maxAttempts) {
              console.log(`⚠️ Final size ${Math.round(sizeKB)}KB still over ${maxSizeKB}KB limit. Attempting final aggressive compression...`);
              
              // Aggressive final compression
              currentWidth = Math.floor(currentWidth * 0.7);
              currentHeight = Math.floor(currentHeight * 0.7);
              currentQuality = 0.3;
              attempts++;
              
              // Ensure minimum dimensions
              if (currentWidth < 200 || currentHeight < 200) {
                console.log(`⚠️ Reached minimum dimensions. Final size: ${Math.round(sizeKB)}KB`);
                resolve({
                  file: compressedFile,
                  preview: canvas.toDataURL(blob.type, currentQuality),
                  size: Math.round(sizeKB)
                });
                return;
              }
              
              tryCompress();
              return;
            }
            
            console.log(`✅ Image compression completed: ${Math.round(sizeKB)}KB (target: ${maxSizeKB}KB)`);
            resolve({
              file: compressedFile,
              preview: canvas.toDataURL(blob.type, currentQuality),
              size: Math.round(sizeKB)
            });
          } else {
            attempts++;
            
            // Strategy 1: Reduce quality first (more efficient for photos)
            if (currentQuality > 0.3) {
              currentQuality = Math.max(0.3, currentQuality - 0.15);
            }
            // Strategy 2: If quality is already low, reduce dimensions
            else if (currentWidth > 300 || currentHeight > 300) {
              const reductionFactor = 0.85;
              currentWidth = Math.floor(currentWidth * reductionFactor);
              currentHeight = Math.floor(currentHeight * reductionFactor);
              currentQuality = Math.max(0.2, currentQuality - 0.05);
            }
            // Strategy 3: Final aggressive reduction
            else {
              currentQuality = Math.max(0.1, currentQuality - 0.1);
              const reductionFactor = 0.8;
              currentWidth = Math.floor(currentWidth * reductionFactor);
              currentHeight = Math.floor(currentHeight * reductionFactor);
            }
            
            // Prevent infinite loop with minimum constraints
            if (currentWidth < 200 || currentHeight < 200 || currentQuality < 0.1) {
              console.log(`⚠️ Reached compression limits. Final size: ${Math.round(sizeKB)}KB`);
              resolve({
                file: compressedFile,
                preview: canvas.toDataURL(blob.type, currentQuality),
                size: Math.round(sizeKB)
              });
              return;
            }
            
            tryCompress();
          }
        }, file.type, currentQuality);
      };
      
      tryCompress();
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
    return getOptimizedCloudinaryUrl(originalUrl, {
      width: options.width,
      height: options.height,
      quality: typeof options.quality === 'number' ? options.quality : 80,
      format: options.format === 'auto' ? 'auto' : (options.format || 'auto')
    });
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
 * Create fallback avatar URL - Updated to use Cloudinary
 */
export const getFallbackAvatarUrl = (name: string, size: number = 400): string => {
  // Use Cloudinary fallback avatar for better performance
  return getCloudinaryFallbackAvatarUrl(name, size);
};