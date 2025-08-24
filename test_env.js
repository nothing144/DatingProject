// Test environment variables loading
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

console.log('🔍 Environment Variables Check:');
console.log('VITE_SUPABASE_URL:', supabaseUrl);
console.log('VITE_SUPABASE_ANON_KEY:', supabaseAnonKey ? `${supabaseAnonKey.substring(0, 20)}...` : 'MISSING');

if (!supabaseUrl) {
  console.error('❌ VITE_SUPABASE_URL is missing!');
} else {
  console.log('✅ VITE_SUPABASE_URL is loaded');
}

if (!supabaseAnonKey) {
  console.error('❌ VITE_SUPABASE_ANON_KEY is missing!');
} else {
  console.log('✅ VITE_SUPABASE_ANON_KEY is loaded');
}

try {
  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  console.log('✅ Supabase client created successfully');
  
  // Test connection
  const { data, error } = await supabase.auth.getSession();
  console.log('🔗 Connection test:', error ? '❌ Failed' : '✅ Success');
} catch (error) {
  console.error('❌ Supabase client creation failed:', error.message);
}