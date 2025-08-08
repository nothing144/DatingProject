import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://ljjyipvvxmduvxoyzvhf.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxqanlpcHZ2eG1kdXZ4b3l6dmhmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM5NDcxNzMsImV4cCI6MjA2OTUyMzE3M30.fWaVeL9482grgbXGcwYQu-ehDV5L3xyG-vix8Os8hno";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function addUsernameColumn() {
  console.log("Adding username column to profiles table...");
  
  try {
    // First, let's check the current table structure
    console.log("Checking current profiles table structure...");
    const { data: profiles, error: fetchError } = await supabase
      .from('profiles')
      .select('*')
      .limit(1);
      
    if (fetchError) {
      console.log("Table structure check error:", fetchError);
    } else {
      console.log("Sample profile data:", profiles[0]);
      if (profiles[0] && profiles[0].username !== undefined) {
        console.log("✅ Username column already exists!");
        return;
      }
    }

    // Try to use the RPC function approach
    console.log("Attempting to add username column via SQL...");
    
    // We can't directly execute DDL statements through the anon key
    // Let's try a different approach - check if we can test the column
    const { data: testData, error: testError } = await supabase
      .from('profiles')
      .select('username')
      .limit(1);
      
    if (testError) {
      if (testError.message.includes('column "username" does not exist')) {
        console.log("❌ Username column does not exist in the database.");
        console.log("❌ Cannot add column with anon key - requires service_role key or direct database access.");
        console.log("❌ The migration needs to be run by someone with database admin privileges.");
        console.log("\n📋 MANUAL STEPS NEEDED:");
        console.log("1. Run the migration SQL manually in Supabase Dashboard:");
        console.log("   ALTER TABLE profiles ADD COLUMN username text;");
        console.log("   ALTER TABLE profiles ADD CONSTRAINT profiles_username_unique UNIQUE (username);");
        console.log("   CREATE INDEX idx_profiles_username ON profiles(username) WHERE username IS NOT NULL;");
        console.log("\n2. Or run: npx supabase db push (after proper authentication)");
        
        return;
      }
      console.log("Unexpected error:", testError);
    } else {
      console.log("✅ Username column already exists!");
    }
    
  } catch (error) {
    console.error("Error:", error);
  }
}

addUsernameColumn();