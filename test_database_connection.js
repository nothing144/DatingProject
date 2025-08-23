#!/usr/bin/env node

/**
 * Simple script to test database connection and check current policies
 * This helps verify if the database is accessible and what policies exist
 */

const { createClient } = require('@supabase/supabase-js');

// Read environment variables from frontend .env file if available
require('dotenv').config({ path: './frontend/.env' });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;

console.log('🔍 Testing Database Connection and Policies\n');

if (!SUPABASE_URL) {
  console.error('❌ VITE_SUPABASE_URL not found in environment');
  console.log('💡 Make sure you have a .env file in /app/frontend/ with your Supabase credentials');
  process.exit(1);
}

if (!SUPABASE_ANON_KEY) {
  console.error('❌ VITE_SUPABASE_ANON_KEY not found in environment');
  console.log('💡 Make sure you have a .env file in /app/frontend/ with your Supabase credentials');
  process.exit(1);
}

console.log('📋 Configuration:');
console.log(`   URL: ${SUPABASE_URL}`);
console.log(`   Key: ${SUPABASE_ANON_KEY.substring(0, 20)}...`);

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testConnection() {
  try {
    console.log('\n⏳ Testing connection...');
    
    // Test basic connection
    const { data, error } = await supabase
      .from('profiles')
      .select('count', { count: 'exact', head: true });

    if (error) {
      console.error('❌ Connection failed:', error.message);
      return false;
    }

    console.log('✅ Database connection successful');
    console.log(`📊 Found ${data} profiles in database`);

    // Check if notifications table exists
    console.log('\n⏳ Checking notifications table...');
    const { data: notifData, error: notifError } = await supabase
      .from('notifications')
      .select('count', { count: 'exact', head: true });

    if (notifError) {
      console.error('❌ Notifications table issue:', notifError.message);
    } else {
      console.log(`✅ Notifications table accessible (${notifData} records)`);
    }

    // Check if date_requests table exists
    console.log('\n⏳ Checking date_requests table...');
    const { data: dateData, error: dateError } = await supabase
      .from('date_requests')
      .select('count', { count: 'exact', head: true });

    if (dateError) {
      console.error('❌ Date requests table issue:', dateError.message);
    } else {
      console.log(`✅ Date requests table accessible (${dateData} records)`);
    }

    return true;

  } catch (error) {
    console.error('❌ Unexpected error:', error);
    return false;
  }
}

async function checkPolicies() {
  try {
    console.log('\n⏳ Attempting to check policies...');
    
    // This might not work with anon key, but worth trying
    const { data, error } = await supabase
      .rpc('exec_raw_sql', { 
        sql: `
          SELECT schemaname, tablename, policyname, cmd 
          FROM pg_policies 
          WHERE tablename IN ('notifications', 'date_requests')
          ORDER BY tablename, cmd;
        `
      });

    if (error) {
      console.log('⚠️  Cannot check policies with current permissions (this is normal)');
      console.log('💡 Policies need to be checked from Supabase dashboard or with service role key');
    } else {
      console.log('📋 Current policies:');
      if (data && data.length > 0) {
        data.forEach(policy => {
          console.log(`   ${policy.tablename}.${policy.cmd}: ${policy.policyname}`);
        });
      } else {
        console.log('   No policies found (or insufficient permissions)');
      }
    }

  } catch (error) {
    console.log('⚠️  Could not check policies:', error.message);
  }
}

// Run tests
(async () => {
  const connected = await testConnection();
  
  if (connected) {
    await checkPolicies();
    console.log('\n🎯 Next Steps:');
    console.log('   1. Apply the DELETE policies using the SQL commands in DELETE_POLICIES_FIX.md');
    console.log('   2. Test deletion functionality in your app');
    console.log('   3. Check browser console for detailed error messages if deletions still fail');
  } else {
    console.log('\n🔧 Fix Connection Issues:');
    console.log('   1. Check your .env file in /app/frontend/');
    console.log('   2. Verify VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are correct');
    console.log('   3. Make sure your Supabase project is active');
  }
})();