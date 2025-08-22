// Cloudinary utilities - FRONTEND SAFE VERSION
// Note: This file should only contain PUBLIC operations

// Cloudinary configuration - PUBLIC KEYS ONLY
const CLOUDINARY_CONFIG = {
  cloud_name: import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || 'your_cloudinary_cloud_name',
  api_key: import.meta.env.VITE_CLOUDINARY_API_KEY || '855887866717832',
  // API_SECRET REMOVED - Should never be in frontend code
};

export const uploadImageToCloudinary = async (file: File): Promise<string> => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', 'unsigned_preset'); // Use unsigned preset for frontend uploads
  
  try {
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUDINARY_CONFIG.cloud_name}/image/upload`,
      {
        method: 'POST',
        body: formData,
      }
    );
    
    if (!response.ok) {
      throw new Error('Failed to upload image');
    }
    
    const data = await response.json();
    return data.secure_url;
  } catch (error) {
    console.error('Error uploading to Cloudinary:', error);
    throw error;
  }
};

// SECURITY NOTE: Image deletion should be handled by edge functions/backend
// This avoids exposing API secrets in frontend code
export const requestImageDeletion = async (publicId: string): Promise<boolean> => {
  try {
    // Call your secure edge function instead of direct Cloudinary API
    const response = await fetch('/api/delete-image', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ publicId }),
    });
    
    return response.ok;
  } catch (error) {
    console.error('Error requesting image deletion:', error);
    return false;
  }
};

export const getOptimizedImageUrl = (url: string, options: {
  width?: number;
  height?: number;
  quality?: number;
  format?: string;
} = {}): string => {
  if (!url || !url.includes('cloudinary.com')) {
    return url;
  }
  
  const { width, height, quality = 80, format = 'auto' } = options;
  
  // Build transformation string
  const transformations = [];
  if (width) transformations.push(`w_${width}`);
  if (height) transformations.push(`h_${height}`);
  transformations.push(`q_${quality}`, `f_${format}`);
  
  const transformString = transformations.join(',');
  
  // Insert transformations into Cloudinary URL
  return url.replace('/upload/', `/upload/${transformString}/`);
};

// Helper functions
export const isCloudinaryUrl = (url: string): boolean => {
  return url.includes('cloudinary.com');
};

export const extractPublicIdFromUrl = (url: string): string | null => {
  if (!isCloudinaryUrl(url)) return null;
  const matches = url.match(/\/v\d+\/(.+)\./);
  return matches ? matches[1] : null;
};

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

export const deleteImageFromCloudinary = async (publicId: string): Promise<boolean> => {
  try {
    // Call your secure edge function instead of direct Cloudinary API
    const response = await fetch('/api/delete-image', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ publicId }),
    });
    
    return response.ok;
  } catch (error) {
    console.error('Error deleting image from Cloudinary:', error);
    return false;
  }
};