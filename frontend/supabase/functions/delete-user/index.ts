import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://iterdating.netlify.app',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-requested-with, accept',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Max-Age': '86400',
  'Access-Control-Allow-Credentials': 'false',
}

serve(async (req) => {
  console.log(`🚀 Edge function called with method: ${req.method}`);
  
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
    console.log('🔍 Environment variables check...');
    
    // Just check if basic env vars exist
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');

    console.log(`Environment check - URL: ${supabaseUrl ? '✅' : '❌'}, Service Key: ${supabaseServiceKey ? '✅' : '❌'}, Anon Key: ${supabaseAnonKey ? '✅' : '❌'}`);

    if (!supabaseUrl || !supabaseServiceKey || !supabaseAnonKey) {
      const missingVars = [];
      if (!supabaseUrl) missingVars.push('SUPABASE_URL');
      if (!supabaseServiceKey) missingVars.push('SUPABASE_SERVICE_ROLE_KEY');
      if (!supabaseAnonKey) missingVars.push('SUPABASE_ANON_KEY');
      
      return new Response(
        JSON.stringify({ 
          error: 'Missing environment variables', 
          missing: missingVars,
          message: 'Please check edge function secrets configuration'
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // For now, just return a test response
    return new Response(
      JSON.stringify({ 
        message: 'Edge function is working!',
        status: 'Environment variables are properly configured',
        timestamp: new Date().toISOString()
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

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