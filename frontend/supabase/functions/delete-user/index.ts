import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

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
    console.log('🔍 Validating environment variables...');
    
    // Validate required environment variables
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');

    console.log(`Environment check - URL: ${supabaseUrl ? '✅' : '❌'}, Service Key: ${supabaseServiceKey ? '✅' : '❌'}, Anon Key: ${supabaseAnonKey ? '✅' : '❌'}`);

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
        JSON.stringify({ error: 'Server configuration error: Missing service role key. Please set SUPABASE_SERVICE_ROLE_KEY in edge function secrets.' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    if (!supabaseAnonKey) {
      console.error('❌ SUPABASE_ANON_KEY environment variable is missing');
      return new Response(
        JSON.stringify({ error: 'Server configuration error: Missing anon key. Please set SUPABASE_ANON_KEY in edge function secrets.' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Get the authorization header
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

    console.log('🔐 Creating Supabase clients...');
    
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

    console.log('👤 Verifying user authentication...');
    
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

    console.log(`✅ User authenticated: ${user.id}`);
    console.log(`🚀 Starting complete user deletion for user: ${user.id}`);
    
    // Initialize deletion results
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

    console.log('🗑️ Starting database cleanup...');

    // Delete messages
    try {
      console.log('📧 Deleting messages...');
      const { error } = await supabaseAdmin.from('messages').delete().eq('sender_id', user.id);
      deletionResults.messages = !error;
      if (error) {
        console.warn('⚠️ Messages deletion error:', error);
      } else {
        console.log('✅ Messages deleted');
      }
    } catch (err) {
      console.warn('⚠️ Messages deletion exception:', err);
    }

    // Delete conversations
    try {
      console.log('💬 Deleting conversations...');
      const { error } = await supabaseAdmin.from('conversations').delete().or(`participant_1.eq.${user.id},participant_2.eq.${user.id}`);
      deletionResults.conversations = !error;
      if (error) {
        console.warn('⚠️ Conversations deletion error:', error);
      } else {
        console.log('✅ Conversations deleted');
      }
    } catch (err) {
      console.warn('⚠️ Conversations deletion exception:', err);
    }

    // Delete date requests
    try {
      console.log('💕 Deleting date requests...');
      const { error } = await supabaseAdmin.from('date_requests').delete().or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`);
      deletionResults.dateRequests = !error;
      if (error) {
        console.warn('⚠️ Date requests deletion error:', error);
      } else {
        console.log('✅ Date requests deleted');
      }
    } catch (err) {
      console.warn('⚠️ Date requests deletion exception:', err);
    }

    // Delete announcements
    try {
      console.log('📢 Deleting announcements...');
      const { error } = await supabaseAdmin.from('announcements').delete().eq('author_id', user.id);
      deletionResults.announcements = !error;
      if (error) {
        console.warn('⚠️ Announcements deletion error:', error);
      } else {
        console.log('✅ Announcements deleted');
      }
    } catch (err) {
      console.warn('⚠️ Announcements deletion exception:', err);
    }

    // Delete confessions
    try {
      console.log('🤐 Deleting confessions...');
      const { error } = await supabaseAdmin.from('confessions').delete().eq('author_id', user.id);
      deletionResults.confessions = !error;
      if (error) {
        console.warn('⚠️ Confessions deletion error:', error);
      } else {
        console.log('✅ Confessions deleted');
      }
    } catch (err) {
      console.warn('⚠️ Confessions deletion exception:', err);
    }

    // Delete notifications
    try {
      console.log('🔔 Deleting notifications...');
      const { error } = await supabaseAdmin.from('notifications').delete().eq('user_id', user.id);
      deletionResults.notifications = !error;
      if (error) {
        console.warn('⚠️ Notifications deletion error:', error);
      } else {
        console.log('✅ Notifications deleted');
      }
    } catch (err) {
      console.warn('⚠️ Notifications deletion exception:', err);
    }

    // Delete favorites (ignore if table doesn't exist)
    try {
      console.log('⭐ Deleting favorites...');
      const { error } = await supabaseAdmin.from('favorites').delete().or(`user_id.eq.${user.id},profile_id.eq.${user.id}`);
      deletionResults.favorites = !error;
      if (error) {
        console.warn('⚠️ Favorites deletion error (table might not exist, ignoring):', error);
        deletionResults.favorites = true; // Mark as success since user said to ignore
      } else {
        console.log('✅ Favorites deleted');
      }
    } catch (err) {
      console.warn('⚠️ Favorites deletion exception (ignoring as requested):', err);
      deletionResults.favorites = true; // Mark as success since user said to ignore
    }

    // Delete profile (critical step)
    try {
      console.log('👤 Deleting profile...');
      const { error } = await supabaseAdmin.from('profiles').delete().eq('id', user.id);
      deletionResults.profile = !error;
      if (error) {
        console.error('❌ Critical: Profile deletion failed:', error);
        throw new Error(`Profile deletion failed: ${error.message}`);
      } else {
        console.log('✅ Profile deleted');
      }
    } catch (err) {
      console.error('❌ Critical: Profile deletion exception:', err);
      throw err;
    }

    // Finally delete the auth user
    console.log('🔐 Deleting authentication user...');
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(user.id)

    if (deleteError) {
      console.error('❌ Auth user deletion failed:', deleteError)
      return new Response(
        JSON.stringify({ 
          error: deleteError.message,
          partialSuccess: true,
          deletionResults: deletionResults
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const successCount = Object.values(deletionResults).filter(Boolean).length;
    const totalSteps = Object.keys(deletionResults).length;

    console.log(`✅ Complete user deletion successful. Database: ${successCount}/${totalSteps}, Auth: ✅`);

    return new Response(
      JSON.stringify({ 
        message: 'User and all associated data deleted successfully',
        details: {
          authUser: true,
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