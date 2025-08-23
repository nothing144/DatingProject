import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://iterdating.netlify.app', // ✅ Fixed for production domain
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-requested-with, accept',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Max-Age': '86400',
  'Access-Control-Allow-Credentials': 'true', // Enable credentials for authenticated requests
}

// Cloudinary configuration from environment variables
const CLOUDINARY_CONFIG = {
  cloud_name: Deno.env.get('CLOUDINARY_CLOUD_NAME') || 'dlnatlmdq',
  api_key: Deno.env.get('CLOUDINARY_API_KEY') || '855887866717832',
  api_secret: Deno.env.get('CLOUDINARY_API_SECRET'), // Must be set in Supabase edge function secrets
};

// Helper function to generate signature for Cloudinary deletion
async function generateCloudinarySignature(publicId: string, timestamp: number): Promise<string> {
  const paramsToSign = `public_id=${publicId}&timestamp=${timestamp}${CLOUDINARY_CONFIG.api_secret}`;
  
  // Use Web Crypto API for SHA-1 hashing
  const encoder = new TextEncoder();
  const data = encoder.encode(paramsToSign);
  const hashBuffer = await crypto.subtle.digest('SHA-1', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  
  return hashHex;
}

// Helper function to extract public_id from Cloudinary URL
function extractPublicIdFromUrl(url: string): string | null {
  if (!url || !url.includes('cloudinary.com')) {
    return null;
  }
  
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
}

// Helper function to delete image from Cloudinary
async function deleteImageFromCloudinary(publicId: string): Promise<{ success: boolean; error?: string }> {
  try {
    if (!CLOUDINARY_CONFIG.api_secret) {
      console.warn('❌ Cloudinary API secret not configured in edge function');
      return { success: false, error: 'API secret not configured in edge function. Please set CLOUDINARY_API_SECRET in Supabase edge function secrets.' };
    }

    const timestamp = Math.round(Date.now() / 1000);
    const signature = await generateCloudinarySignature(publicId, timestamp);

    const formData = new FormData();
    formData.append('public_id', publicId);
    formData.append('api_key', CLOUDINARY_CONFIG.api_key);
    formData.append('timestamp', timestamp.toString());
    formData.append('signature', signature);

    console.log(`🖼️ Attempting to delete Cloudinary image: ${publicId}`);

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUDINARY_CONFIG.cloud_name}/image/destroy`,
      {
        method: 'POST',
        body: formData,
      }
    );

    const result = await response.json();
    
    if (response.ok && result.result === 'ok') {
      console.log(`✅ Cloudinary image deleted successfully: ${publicId}`);
      return { success: true };
    } else {
      console.warn(`⚠️ Cloudinary deletion failed for ${publicId}:`, result);
      return { success: false, error: result.error?.message || 'Deletion failed' };
    }
  } catch (error) {
    console.error(`❌ Error deleting Cloudinary image ${publicId}:`, error);
    return { success: false, error: error.message };
  }
}

serve(async (req) => {
  console.log(`🚀 Cloudinary deletion edge function called with method: ${req.method}`);
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log('📋 Handling OPTIONS request');
    return new Response('ok', { 
      headers: corsHeaders,
      status: 200
    })
  }

  // Only allow POST method
  if (req.method !== 'POST') {
    console.log(`❌ Method ${req.method} not allowed`);
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { 
        status: 405, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }

  try {
    // Parse request body only for POST requests (OPTIONS requests don't have a body)
    let body = {};
    if (req.method === 'POST') {
      try {
        body = await req.json();
      } catch (jsonError) {
        console.error('❌ Invalid JSON in request body:', jsonError);
        return new Response(
          JSON.stringify({ error: 'Invalid JSON in request body' }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }
    }

    const { imageUrl, publicId } = body;

    // Get authorization header to verify user is authenticated
    const authHeader = req.headers.get('Authorization')
    
    if (!authHeader) {
      console.error('❌ No authorization header provided');
      return new Response(
        JSON.stringify({ error: 'Authorization header missing' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    if (!imageUrl && !publicId) {
      return new Response(
        JSON.stringify({ error: 'Either imageUrl or publicId is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Extract public_id from URL if not provided directly
    let finalPublicId = publicId;
    if (!finalPublicId && imageUrl) {
      finalPublicId = extractPublicIdFromUrl(imageUrl);
      if (!finalPublicId) {
        return new Response(
          JSON.stringify({ error: 'Could not extract public_id from image URL' }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }
    }

    // Verify user is authenticated with Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');

    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('❌ Supabase configuration missing');
      return new Response(
        JSON.stringify({ error: 'Server configuration error' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const supabase = createClient(
      supabaseUrl,
      supabaseAnonKey,
      { 
        auth: { 
          autoRefreshToken: false, 
          persistSession: false 
        },
        global: { 
          headers: { 
            Authorization: authHeader 
          } 
        }
      }
    )

    // Verify the user is authenticated
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      console.error('❌ User authentication failed:', userError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log(`✅ User authenticated: ${user.id}, deleting image: ${finalPublicId}`);

    // Delete the image from Cloudinary
    const deleteResult = await deleteImageFromCloudinary(finalPublicId);

    if (deleteResult.success) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Image deleted successfully from Cloudinary',
          publicId: finalPublicId
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    } else {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: deleteResult.error,
          publicId: finalPublicId
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

  } catch (error) {
    console.error('❌ Function error:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error', 
        details: error.message,
        timestamp: new Date().toISOString()
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})