import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://iterdating.netlify.app',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-requested-with, accept',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Max-Age': '86400',
  'Access-Control-Allow-Credentials': 'true',
}

// Cloudinary configuration from environment variables
const CLOUDINARY_CONFIG = {
  cloud_name: Deno.env.get('CLOUDINARY_CLOUD_NAME') || 'dlnatlmdq',
  api_key: Deno.env.get('CLOUDINARY_API_KEY') || '855887866717832',
  api_secret: Deno.env.get('CLOUDINARY_API_SECRET'), // Must be set in Supabase edge function secrets
};

// Helper function to generate signature for Cloudinary deletion
async function generateCloudinarySignature(publicId: string, timestamp: number): Promise<string> {
  const paramsToSign = `public_id=${publicId}&timestamp=${timestamp}${CLOUDINARY_CONFIG.api_secret}`
  const encoder = new TextEncoder()
  const data = encoder.encode(paramsToSign)
  const hashBuffer = await crypto.subtle.digest('SHA-1', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

// Extract public_id from Cloudinary URL
function extractPublicIdFromUrl(url: string): string | null {
  if (!url || !url.includes('cloudinary.com')) return null
  try {
    const urlParts = url.split('/')
    const uploadIndex = urlParts.indexOf('upload')
    if (uploadIndex === -1) return null
    let pathAfterUpload = urlParts.slice(uploadIndex + 1).join('/')
    pathAfterUpload = pathAfterUpload.replace(/\.[^.]+$/, '') // remove extension
    return pathAfterUpload
  } catch {
    return null
  }
}

// Delete image from Cloudinary
async function deleteImageFromCloudinary(publicId: string) {
  try {
    if (!CLOUDINARY_CONFIG.api_secret) {
      return { success: false, error: 'API secret not configured in edge function' }
    }

    const timestamp = Math.round(Date.now() / 1000)
    const signature = await generateCloudinarySignature(publicId, timestamp)

    const formData = new FormData()
    formData.append('public_id', publicId)
    formData.append('api_key', CLOUDINARY_CONFIG.api_key)
    formData.append('timestamp', timestamp.toString())
    formData.append('signature', signature)

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUDINARY_CONFIG.cloud_name}/image/destroy`,
      { method: 'POST', body: formData }
    )

    const result = await response.json().catch(() => ({}))
    if (response.ok && result.result === 'ok') {
      return { success: true }
    } else {
      return { success: false, error: result.error?.message || 'Deletion failed' }
    }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

serve(async (req) => {
  console.log(`🚀 Cloudinary deletion edge function called with method: ${req.method}`)

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  try {
    // Parse body
    let body: any = {}
    try {
      const bodyText = await req.text()
      if (bodyText.trim()) body = JSON.parse(bodyText)
    } catch {
      return new Response(
        JSON.stringify({ error: 'Invalid JSON in request body' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { imageUrl, publicId } = body

    // Check auth header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authorization header missing' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Validate input
    if (!imageUrl && !publicId) {
      return new Response(
        JSON.stringify({ error: 'Either imageUrl or publicId is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')
    if (!supabaseUrl || !supabaseAnonKey) {
      return new Response(
        JSON.stringify({ error: 'Server configuration error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: { autoRefreshToken: false, persistSession: false },
      global: { headers: { Authorization: authHeader } }
    })

    // Verify user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const finalPublicId = publicId || extractPublicIdFromUrl(imageUrl)
    if (!finalPublicId) {
      return new Response(
        JSON.stringify({ error: 'Could not extract public_id from image URL' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Delete from Cloudinary
    const deleteResult = await deleteImageFromCloudinary(finalPublicId)
    if (deleteResult.success) {
      return new Response(
        JSON.stringify({ success: true, message: 'Image deleted successfully', publicId: finalPublicId }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    } else {
      return new Response(
        JSON.stringify({ success: false, error: deleteResult.error, publicId: finalPublicId }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
