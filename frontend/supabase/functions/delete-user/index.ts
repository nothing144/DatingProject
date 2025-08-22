import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-requested-with',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Max-Age': '86400',
}

// Cloudinary configuration
const CLOUDINARY_CONFIG = {
  cloud_name: Deno.env.get('CLOUDINARY_CLOUD_NAME') || 'dlnatlmdq',
  api_key: Deno.env.get('CLOUDINARY_API_KEY') || '855887866717832',
  api_secret: Deno.env.get('CLOUDINARY_API_SECRET') || '', // This should be set in Supabase edge function secrets
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

// Helper function to delete image from Cloudinary
async function deleteImageFromCloudinary(publicId: string): Promise<{ success: boolean; error?: string }> {
  try {
    if (!CLOUDINARY_CONFIG.api_secret) {
      console.warn('Cloudinary API secret not configured, skipping image deletion');
      return { success: false, error: 'API secret not configured' };
    }

    const timestamp = Math.round(Date.now() / 1000);
    const signature = await generateCloudinarySignature(publicId, timestamp);

    const formData = new FormData();
    formData.append('public_id', publicId);
    formData.append('api_key', CLOUDINARY_CONFIG.api_key);
    formData.append('timestamp', timestamp.toString());
    formData.append('signature', signature);

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUDINARY_CONFIG.cloud_name}/image/destroy`,
      {
        method: 'POST',
        body: formData,
      }
    );

    const result = await response.json();
    
    if (response.ok && result.result === 'ok') {
      console.log(`✅ Cloudinary image deleted: ${publicId}`);
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

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { 
      headers: corsHeaders,
      status: 200
    })
  }

  // Only allow POST method
  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { 
        status: 405, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }

  try {
    // Validate required environment variables
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');

    if (!supabaseUrl) {
      console.error('❌ SUPABASE_URL environment variable is missing');
      return new Response(
        JSON.stringify({ error: 'Server configuration error: Missing SUPABASE_URL' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    if (!supabaseServiceKey) {
      console.error('❌ SUPABASE_SERVICE_ROLE_KEY environment variable is missing');
      return new Response(
        JSON.stringify({ error: 'Server configuration error: Missing service role key' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    if (!supabaseAnonKey) {
      console.error('❌ SUPABASE_ANON_KEY environment variable is missing');
      return new Response(
        JSON.stringify({ error: 'Server configuration error: Missing anon key' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Create a Supabase client with the service role key for admin operations
    const supabaseAdmin = createClient(
      supabaseUrl,
      supabaseServiceKey,
      { 
        auth: { 
          autoRefreshToken: false, 
          persistSession: false 
        } 
      }
    )

    // Get the authorization header
    const authHeader = req.headers.get('Authorization')
    
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authorization header missing' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }
    
    // Create a regular Supabase client to verify the user
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
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log(`🚀 Starting complete user deletion for user: ${user.id}`);
    
    // Step 1: Get user's profile to find avatar for Cloudinary deletion
    let avatarUrl = null;
    try {
      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('avatar_url')
        .eq('id', user.id)
        .single();
      
      avatarUrl = profile?.avatar_url;
      console.log(`📸 User avatar URL: ${avatarUrl || 'none'}`);
    } catch (error) {
      console.warn('⚠️ Could not fetch user profile for avatar deletion:', error);
    }

    // Step 2: Delete avatar from Cloudinary if it exists
    let cloudinaryDeleted = false;
    if (avatarUrl && avatarUrl.includes('cloudinary.com')) {
      const publicId = extractPublicIdFromUrl(avatarUrl);
      if (publicId) {
        const cloudinaryResult = await deleteImageFromCloudinary(publicId);
        cloudinaryDeleted = cloudinaryResult.success;
        if (cloudinaryResult.success) {
          console.log('✅ Cloudinary image deleted successfully');
        } else {
          console.warn('⚠️ Cloudinary image deletion failed:', cloudinaryResult.error);
        }
      }
    }

    // Step 3: Delete all user data from database (let foreign key constraints handle cascade)
    const deletionResults = {
      messages: false,
      conversations: false,
      dateRequests: false,
      announcements: false,
      confessions: false,
      notifications: false,
      favorites: false,
      profile: false
    };

    // Delete messages
    try {
      const { error } = await supabaseAdmin.from('messages').delete().eq('sender_id', user.id);
      deletionResults.messages = !error;
      if (error) console.warn('⚠️ Messages deletion error:', error);
    } catch (err) {
      console.warn('⚠️ Messages deletion exception:', err);
    }

    // Delete conversations
    try {
      const { error } = await supabaseAdmin.from('conversations').delete().or(`participant_1.eq.${user.id},participant_2.eq.${user.id}`);
      deletionResults.conversations = !error;
      if (error) console.warn('⚠️ Conversations deletion error:', error);
    } catch (err) {
      console.warn('⚠️ Conversations deletion exception:', err);
    }

    // Delete date requests
    try {
      const { error } = await supabaseAdmin.from('date_requests').delete().or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`);
      deletionResults.dateRequests = !error;
      if (error) console.warn('⚠️ Date requests deletion error:', error);
    } catch (err) {
      console.warn('⚠️ Date requests deletion exception:', err);
    }

    // Delete announcements
    try {
      const { error } = await supabaseAdmin.from('announcements').delete().eq('author_id', user.id);
      deletionResults.announcements = !error;
      if (error) console.warn('⚠️ Announcements deletion error:', error);
    } catch (err) {
      console.warn('⚠️ Announcements deletion exception:', err);
    }

    // Delete confessions
    try {
      const { error } = await supabaseAdmin.from('confessions').delete().eq('author_id', user.id);
      deletionResults.confessions = !error;
      if (error) console.warn('⚠️ Confessions deletion error:', error);
    } catch (err) {
      console.warn('⚠️ Confessions deletion exception:', err);
    }

    // Delete notifications
    try {
      const { error } = await supabaseAdmin.from('notifications').delete().eq('user_id', user.id);
      deletionResults.notifications = !error;
      if (error) console.warn('⚠️ Notifications deletion error:', error);
    } catch (err) {
      console.warn('⚠️ Notifications deletion exception:', err);
    }

    // Delete favorites
    try {
      const { error } = await supabaseAdmin.from('favorites').delete().or(`user_id.eq.${user.id},profile_id.eq.${user.id}`);
      deletionResults.favorites = !error;
      if (error) console.warn('⚠️ Favorites deletion error:', error);
    } catch (err) {
      console.warn('⚠️ Favorites deletion exception:', err);
    }

    // Delete profile (critical step)
    try {
      const { error } = await supabaseAdmin.from('profiles').delete().eq('id', user.id);
      deletionResults.profile = !error;
      if (error) {
        console.error('❌ Critical: Profile deletion failed:', error);
        throw new Error(`Profile deletion failed: ${error.message}`);
      }
    } catch (err) {
      console.error('❌ Critical: Profile deletion exception:', err);
      throw err;
    }

    // Step 4: Finally delete the auth user
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(user.id)

    if (deleteError) {
      console.error('❌ Auth user deletion failed:', deleteError)
      return new Response(
        JSON.stringify({ 
          error: deleteError.message,
          partialSuccess: true,
          deletionResults: { ...deletionResults, cloudinaryDeleted }
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const successCount = Object.values(deletionResults).filter(Boolean).length;
    const totalSteps = Object.keys(deletionResults).length;

    console.log(`✅ Complete user deletion successful. Database: ${successCount}/${totalSteps}, Cloudinary: ${cloudinaryDeleted ? '✅' : '❌'}, Auth: ✅`);

    return new Response(
      JSON.stringify({ 
        message: 'User and all associated data deleted successfully',
        details: {
          authUser: true,
          cloudinaryImage: cloudinaryDeleted,
          databaseRecords: deletionResults,
          summary: `${successCount}/${totalSteps} database tables cleaned`
        }
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('❌ Function error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})