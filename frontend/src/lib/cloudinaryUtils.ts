// Cloudinary utilities - FRONTEND SAFE VERSION
// Note: This file should only contain PUBLIC operations

import { supabase } from "@/integrations/supabase/client";

// Cloudinary configuration - PUBLIC KEYS ONLY (from environment variables)
const CLOUDINARY_CONFIG = {
  cloud_name: import.meta.env.VITE_CLOUDINARY_CLOUD_NAME,
  api_key: import.meta.env.VITE_CLOUDINARY_API_KEY,
  // API_SECRET is NEVER included in frontend - always kept server-side
};

export const uploadImageToCloudinary = async (
  file: File, 
  userId?: string, 
  options: { folder?: string } = {}
): Promise<{ url: string; public_id: string }> => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', 'heartbeat_preset'); // Use the correct preset name
  
  // Add folder if specified
  if (options.folder) {
    formData.append('folder', options.folder);
  }
  
  // Add public_id with user prefix if userId provided
  if (userId) {
    const timestamp = Date.now();
    formData.append('public_id', `${options.folder || 'avatars'}/${userId}_${timestamp}`);
  }
  
  try {
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUDINARY_CONFIG.cloud_name}/image/upload`,
      {
        method: 'POST',
        body: formData,
      }
    );
    
    if (!response.ok) {
      const errorData = await response.text();
      console.error('Cloudinary upload failed:', errorData);
      throw new Error(`Failed to upload image: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    return {
      url: data.secure_url,
      public_id: data.public_id
    };
  } catch (error) {
    console.error('Error uploading to Cloudinary:', error);
    throw error;
  }
};

// SECURE IMAGE DELETION: This function calls our secure edge function
export const deleteImageFromCloudinary = async (imageUrl: string): Promise<{ success: boolean; error?: string }> => {
  try {
    console.log('🖼️ Requesting secure image deletion via edge function...');
    
    // Get current session for authentication
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.access_token) {
      console.error('❌ No authentication session found');
      return { success: false, error: 'User not authenticated' };
    }

    // Call our secure edge function for image deletion
    const edgeFunctionUrl = `${supabase.supabaseUrl}/functions/v1/delete-cloudinary-image`;
    
    const response = await fetch(edgeFunctionUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
        'x-client-info': 'heartbeat-web',
      },
      body: JSON.stringify({ imageUrl }),
    });

    const result = await response.json();
    
    if (response.ok && result.success) {
      console.log('✅ Image deleted successfully via secure edge function');
      return { success: true };
    } else {
      console.warn('⚠️ Secure image deletion failed:', result.error);
      return { success: false, error: result.error || 'Deletion failed' };
    }
    
  } catch (error: any) {
    console.error('❌ Error calling secure image deletion:', error);
    return { success: false, error: error.message || 'Network error' };
  }
};

// Alternative method for direct public_id deletion
export const deleteImageByPublicId = async (publicId: string): Promise<{ success: boolean; error?: string }> => {
  try {
    console.log('🖼️ Requesting secure image deletion by public_id via edge function...');
    
    // Get current session for authentication
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.access_token) {
      console.error('❌ No authentication session found');
      return { success: false, error: 'User not authenticated' };
    }

    // Call our secure edge function for image deletion
    const edgeFunctionUrl = `${supabase.supabaseUrl}/functions/v1/delete-cloudinary-image`;
    
    const response = await fetch(edgeFunctionUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
        'x-client-info': 'heartbeat-web',
      },
      body: JSON.stringify({ publicId }),
    });

    const result = await response.json();
    
    if (response.ok && result.success) {
      console.log('✅ Image deleted successfully by public_id via secure edge function');
      return { success: true };
    } else {
      console.warn('⚠️ Secure image deletion by public_id failed:', result.error);
      return { success: false, error: result.error || 'Deletion failed' };
    }
    
  } catch (error: any) {
    console.error('❌ Error calling secure image deletion by public_id:', error);
    return { success: false, error: error.message || 'Network error' };
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
  
  try {
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