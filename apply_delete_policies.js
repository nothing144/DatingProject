#!/usr/bin/env node

/**
 * Script to apply the missing DELETE policies to Supabase database
 * Run this with: node apply_delete_policies.js
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// You'll need to provide your Supabase credentials
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'YOUR_SUPABASE_URL';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || 'YOUR_SERVICE_ROLE_KEY'; // Need service role key for admin operations

if (!SUPABASE_URL || SUPABASE_URL === 'YOUR_SUPABASE_URL') {
  console.error('❌ Please set VITE_SUPABASE_URL environment variable');
  process.exit(1);
}

if (!SUPABASE_SERVICE_KEY || SUPABASE_SERVICE_KEY === 'YOUR_SERVICE_ROLE_KEY') {
  console.error('❌ Please set SUPABASE_SERVICE_KEY environment variable with your service role key');
  console.log('💡 You can find this in your Supabase dashboard under Settings > API > service_role key');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function applyDeletePolicies() {
  console.log('🚀 Applying DELETE policies to fix deletion issue...\n');

  try {
    // Read the migration file
    const migrationPath = path.join(__dirname, 'frontend/supabase/migrations/20250108000000_add_delete_policies.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    // Split SQL statements by semicolon and filter out comments/empty lines
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt && !stmt.startsWith('/*') && !stmt.startsWith('--'));

    console.log(`📋 Found ${statements.length} SQL statements to execute\n`);

    // Execute each SQL statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      console.log(`⏳ Executing statement ${i + 1}/${statements.length}...`);
      console.log(`📝 SQL: ${statement.substring(0, 100)}...`);

      const { error } = await supabase.rpc('exec_raw_sql', { 
        sql: statement 
      });

      if (error) {
        console.error(`❌ Error executing statement ${i + 1}:`, error);
        throw error;
      }

      console.log(`✅ Statement ${i + 1} executed successfully\n`);
    }

    // Verify policies were created
    console.log('🔍 Verifying DELETE policies were created...');
    
    const { data: policies, error: policyError } = await supabase
      .from('pg_policies')
      .select('schemaname, tablename, policyname, cmd')
      .in('tablename', ['notifications', 'date_requests'])
      .eq('cmd', 'DELETE');

    if (policyError) {
      console.warn('⚠️  Could not verify policies (this is normal):', policyError.message);
    } else if (policies) {
      console.log('📊 DELETE policies found:');
      policies.forEach(policy => {
        console.log(`  ✅ ${policy.tablename}: ${policy.policyname}`);
      });
    }

    console.log('\n🎉 DELETE policies applied successfully!');
    console.log('🛠️  Now users should be able to delete their notifications and date requests.');
    console.log('🔄 Try the delete functionality in your app now.');

  } catch (error) {
    console.error('❌ Failed to apply DELETE policies:', error);
    console.log('\n🔧 Manual fix:');
    console.log('If this script fails, you can manually run these SQL commands in your Supabase SQL editor:');
    console.log('\n-- For notifications:');
    console.log('CREATE POLICY "Users can delete their own notifications" ON public.notifications FOR DELETE TO authenticated USING (auth.uid() = user_id);');
    console.log('\n-- For date requests:');
    console.log('CREATE POLICY "Users can delete their date requests" ON public.date_requests FOR DELETE TO authenticated USING (auth.uid() = sender_id OR auth.uid() = receiver_id);');
    
    process.exit(1);
  }
}

// Run the script
applyDeletePolicies();