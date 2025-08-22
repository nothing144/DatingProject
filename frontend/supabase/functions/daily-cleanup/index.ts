import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    console.log('Starting daily cleanup process...')

    // Call the confession cleanup function
    const { data: cleanupResult, error: cleanupError } = await supabaseClient
      .rpc('scheduled_confession_cleanup')

    if (cleanupError) {
      console.error('Cleanup error:', cleanupError)
      throw cleanupError
    }

    console.log('Cleanup completed:', cleanupResult)

    // Additional cleanup tasks can be added here in the future
    const response = {
      success: true,
      timestamp: new Date().toISOString(),
      confession_cleanup: cleanupResult,
      message: 'Daily cleanup completed successfully'
    }

    return new Response(
      JSON.stringify(response),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    )

  } catch (error) {
    console.error('Daily cleanup failed:', error)
    
    return new Response(
      JSON.stringify({ 
        error: error.message,
        success: false,
        timestamp: new Date().toISOString()
      }),
      { 
        status: 500,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    )
  }
})

/* 
Usage:
This edge function should be called daily via:
1. Supabase Cron (if available)
2. External cron service (like cron-job.org)
3. GitHub Actions with scheduled workflow

Example cron setup:
- URL: https://your-project.supabase.co/functions/v1/daily-cleanup
- Method: POST
- Schedule: Daily at 02:00 UTC
- Add Authorization header with anon key if needed
*/