/**
 * Test utilities to verify session validation fix
 * These functions can be called from browser console to test the session caching fix
 */

import { supabase } from "@/integrations/supabase/client";
import { validateSession, clearInvalidSession, getValidSession } from "@/lib/sessionValidation";

/**
 * Simulates the problem scenario by corrupting the session in localStorage
 * This mimics what happens when a user is deleted but session remains cached
 */
export const simulateInvalidSessionBug = () => {
  console.log("🧪 Simulating invalid session bug...");
  
  // Get current session data
  const sessionData = localStorage.getItem('sb-' + supabase.supabaseUrl.split('//')[1] + '-auth-token');
  
  if (sessionData) {
    try {
      const parsedSession = JSON.parse(sessionData);
      console.log("📋 Current session data:", parsedSession);
      
      // Corrupt the session by changing the user ID to a non-existent one
      if (parsedSession.user && parsedSession.user.id) {
        const originalId = parsedSession.user.id;
        parsedSession.user.id = 'deleted-user-' + Date.now();
        parsedSession.access_token = 'invalid-token-' + Date.now();
        
        // Save corrupted session back to localStorage
        localStorage.setItem('sb-' + supabase.supabaseUrl.split('//')[1] + '-auth-token', JSON.stringify(parsedSession));
        
        console.log("🔧 Session corrupted:", {
          originalId,
          corruptedId: parsedSession.user.id,
          corruptedToken: parsedSession.access_token
        });
        
        console.log("⚠️ Session now simulates deleted user scenario");
        console.log("🔄 Reload the page to test the fix");
        
        return true;
      }
    } catch (error) {
      console.error("❌ Error corrupting session:", error);
      return false;
    }
  } else {
    console.log("ℹ️ No session found to corrupt");
    return false;
  }
  
  return false;
};

/**
 * Tests the session validation functionality
 */
export const testSessionValidation = async () => {
  console.log("🧪 Testing session validation...");
  
  try {
    const validation = await validateSession();
    console.log("📋 Validation result:", validation);
    
    if (validation.isValid) {
      console.log("✅ Session is valid");
    } else {
      console.log("❌ Session is invalid:", validation.error);
    }
    
    return validation;
  } catch (error) {
    console.error("❌ Error testing validation:", error);
    return { isValid: false, session: null, error: error.message };
  }
};

/**
 * Tests the getValidSession functionality
 */
export const testGetValidSession = async () => {
  console.log("🧪 Testing getValidSession...");
  
  try {
    const result = await getValidSession();
    console.log("📋 getValidSession result:", result);
    
    if (result.isValid && result.session) {
      console.log("✅ Valid session retrieved:", result.session.user.id);
    } else {
      console.log("❌ No valid session:", result.error);
    }
    
    return result;
  } catch (error) {
    console.error("❌ Error testing getValidSession:", error);
    return { session: null, isValid: false, error: error.message };
  }
};

/**
 * Tests the session cleanup functionality
 */
export const testSessionCleanup = async () => {
  console.log("🧪 Testing session cleanup...");
  
  try {
    await clearInvalidSession();
    console.log("✅ Session cleanup completed");
    
    // Verify cleanup worked
    const sessionAfterCleanup = localStorage.getItem('sb-' + supabase.supabaseUrl.split('//')[1] + '-auth-token');
    console.log("📋 Session after cleanup:", sessionAfterCleanup ? "Still exists" : "Cleared");
    
    return true;
  } catch (error) {
    console.error("❌ Error testing cleanup:", error);
    return false;
  }
};

/**
 * Complete test suite for the session validation fix
 */
export const runSessionFixTestSuite = async () => {
  console.log("🧪 Running complete session fix test suite...");
  console.log("=" .repeat(50));
  
  // Test 1: Validate current session
  console.log("Test 1: Current session validation");
  await testSessionValidation();
  console.log("");
  
  // Test 2: Test getValidSession
  console.log("Test 2: getValidSession functionality");
  await testGetValidSession();
  console.log("");
  
  // Test 3: Simulate the bug
  console.log("Test 3: Simulating invalid session bug");
  const bugSimulated = simulateInvalidSessionBug();
  
  if (bugSimulated) {
    console.log("");
    console.log("Test 4: Testing validation with corrupted session");
    await testSessionValidation();
    console.log("");
    
    console.log("Test 5: Testing getValidSession with corrupted session");
    await testGetValidSession();
    console.log("");
    
    console.log("Test 6: Testing session cleanup");
    await testSessionCleanup();
  } else {
    console.log("%cTest suite incomplete - no session to corrupt", "color: orange");
  }
  
  console.log("=" .repeat(50));
  console.log("🧪 Test suite completed");
};

// Make functions available globally for console access
if (typeof window !== 'undefined') {
  (window as any).sessionTest = {
    simulateInvalidSessionBug,
    testSessionValidation,
    testGetValidSession,
    testSessionCleanup,
    runSessionFixTestSuite
  };
  
  console.log('Session test functions available:');
  console.log('- window.sessionTest.runSessionFixTestSuite() - Run complete test');
  console.log('- window.sessionTest.simulateInvalidSessionBug() - Simulate the bug');
  console.log('- window.sessionTest.testSessionValidation() - Test validation');
  console.log('- window.sessionTest.testSessionCleanup() - Test cleanup');
}