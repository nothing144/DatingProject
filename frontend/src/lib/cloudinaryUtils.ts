/**
 * Cloudinary utilities for image upload and optimization
 * Replaces Supabase Storage for better performance and optimization
 */

import { v2 as cloudinary } from 'cloudinary';

// Cloudinary configuration
const CLOUDINARY_CONFIG = {
  cloud_name: 'dlnatlmdq',
  api_key: '855887866717832',
  api_secret: 'hOrFPVEjc3Pvdz9g3ZevGHMjA5c'
};

// Configure Cloudinary (for server-side operations if needed)
cloudinary.config(CLOUDINARY_CONFIG);

/**
 * Upload image to Cloudinary using the Upload API
 * This replaces Supabase storage upload functionality
 */
export const uploadImageToCloudinary = async (
  file: File,
  userId: string,
  options: {
    folder?: string;
    transformation?: any[];
    public_id?: string;
  } = {}
): Promise<{ url: string; public_id: string }> => {
  try {
    // Create form data for upload
    const formData = new FormData();
    
    // Generate unique public_id
    const timestamp = Date.now();
    const publicId = options.public_id || `user_${userId}_${timestamp}`;
    const folder = options.folder || 'heartbeat_avatars';
    
    formData.append('file', file);
    formData.append('upload_preset', 'heartbeat_preset'); // We'll create this preset
    formData.append('public_id', `${folder}/${publicId}`);
    formData.append('folder', folder);
    
    // Add transformations for optimization
    if (options.transformation) {
      formData.append('transformation', JSON.stringify(options.transformation));
    }
    
    // Upload to Cloudinary
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUDINARY_CONFIG.cloud_name}/image/upload`,
      {
        method: 'POST',
        body: formData,
      }
    );
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || 'Upload failed');
    }
    
    const data = await response.json();
    
    return {
      url: data.secure_url,
      public_id: data.public_id
    };
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    throw error;
  }
};

/**
 * Delete image from Cloudinary
 * This replaces Supabase storage delete functionality
 */
export const deleteImageFromCloudinary = async (publicId: string): Promise<void> => {
  try {
    // For client-side deletion, we'll need to call our backend or use admin API
    // For now, we'll use the destroy method (requires API credentials)
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUDINARY_CONFIG.cloud_name}/image/destroy`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          public_id: publicId,
          api_key: CLOUDINARY_CONFIG.api_key,
          timestamp: Math.round(Date.now() / 1000),
          // Note: In production, you'd generate signature server-side for security
        }),
      }
    );
    
    if (!response.ok) {
      console.warn('Failed to delete image from Cloudinary:', await response.text());
    }
  } catch (error) {
    console.warn('Error deleting image from Cloudinary:', error);
  }
};

/**
 * Generate optimized Cloudinary URL with transformations
 * This replaces the Supabase image URL generation
 */
export const getOptimizedCloudinaryUrl = (
  publicId: string,
  options: {
    width?: number;
    height?: number;
    quality?: number | 'auto';
    format?: string | 'auto';
    crop?: 'fill' | 'fit' | 'crop' | 'scale' | 'thumb';
    gravity?: 'face' | 'faces' | 'center' | 'auto';
    radius?: number | 'max';
    effect?: string;
  } = {}
): string => {
  if (!publicId) return '';
  
  const {
    width = 400,
    height = 400,
    quality = 'auto',
    format = 'auto',
    crop = 'fill',
    gravity = 'face',
    radius,
    effect
  } = options;
  
  // Build transformation string
  const transformations = [];
  
  // Basic transformations
  if (width || height) {
    transformations.push(`w_${width},h_${height},c_${crop}`);
  }
  
  if (gravity) {
    transformations.push(`g_${gravity}`);
  }
  
  if (quality) {
    transformations.push(`q_${quality}`);
  }
  
  if (format) {
    transformations.push(`f_${format}`);
  }
  
  if (radius) {
    transformations.push(`r_${radius}`);
  }
  
  if (effect) {
    transformations.push(`e_${effect}`);
  }
  
  const transformString = transformations.join(',');
  
  // Return Cloudinary URL
  return `https://res.cloudinary.com/${CLOUDINARY_CONFIG.cloud_name}/image/upload/${transformString}/${publicId}`;
};

/**
 * Get thumbnail version of image for grid view
 * Replaces getThumbnailUrl from imageUtils.ts
 */
export const getCloudinaryThumbnailUrl = (publicId: string): string => {
  return getOptimizedCloudinaryUrl(publicId, {
    width: 300,
    height: 300,
    quality: 'auto',
    format: 'auto',
    crop: 'fill',
    gravity: 'face'
  });
};

/**
 * Get high quality version of image for single profile view
 * Replaces getHighQualityUrl from imageUtils.ts
 */
export const getCloudinaryHighQualityUrl = (publicId: string): string => {
  return getOptimizedCloudinaryUrl(publicId, {
    width: 800,
    height: 800,
    quality: 'auto',
    format: 'auto',
    crop: 'fill',
    gravity: 'face'
  });
};

/**
 * Extract public_id from Cloudinary URL
 * Helper function to get public_id from existing URLs
 */
export const extractPublicIdFromUrl = (url: string): string | null => {
  if (!url || !url.includes('cloudinary.com')) {
    return null;
  }
  
  try {
    // Extract public_id from Cloudinary URL
    // Format: https://res.cloudinary.com/cloud_name/image/upload/transformations/public_id.extension
    const urlParts = url.split('/');
    const uploadIndex = urlParts.indexOf('upload');
    
    if (uploadIndex === -1) return null;
    
    // Get everything after 'upload' and potential transformations
    let pathAfterUpload = urlParts.slice(uploadIndex + 1).join('/');
    
    // Remove transformation parameters (they start with letters like w_, h_, etc.)
    const transformationRegex = /^[a-z]_[^\/]+,?/;
    while (transformationRegex.test(pathAfterUpload)) {
      pathAfterUpload = pathAfterUpload.replace(/^[^\/]+\//, '');
    }
    
    // Remove file extension
    const publicId = pathAfterUpload.replace(/\.[^.]+$/, '');
    
    return publicId;
  } catch (error) {
    console.error('Error extracting public_id from URL:', error);
    return null;
  }
};

/**
 * Check if URL is a Cloudinary URL
 */
export const isCloudinaryUrl = (url: string): boolean => {
  return url && url.includes('cloudinary.com');
};

/**
 * Fallback avatar URL generator using Cloudinary
 * Replaces getFallbackAvatarUrl from imageUtils.ts
 */
export const getCloudinaryFallbackAvatarUrl = (name: string, size: number = 400): string => {
  // Use Cloudinary's text overlay feature to create avatar
  const encodedName = encodeURIComponent(name);
  return `https://res.cloudinary.com/${CLOUDINARY_CONFIG.cloud_name}/image/upload/w_${size},h_${size},c_fill,b_rgb:6366f1,co_rgb:ffffff,l_text:Arial_${Math.round(size/4)}:${encodedName},g_center/v1/transparent_placeholder.png`;
};

/**
 * Validate image file before upload
 * Same as imageUtils.ts but adapted for Cloudinary
 */
export const validateImageFile = (file: File): { valid: boolean; error?: string } => {
  const maxSize = 10 * 1024 * 1024; // 10MB max
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

export default {
  uploadImageToCloudinary,
  deleteImageFromCloudinary,
  getOptimizedCloudinaryUrl,
  getCloudinaryThumbnailUrl,
  getCloudinaryHighQualityUrl,
  extractPublicIdFromUrl,
  isCloudinaryUrl,
  getCloudinaryFallbackAvatarUrl,
  validateImageFile
};