import { supabase } from "@/integrations/supabase/client";

/**
 * Session validation utilities to handle cached sessions for deleted users
 */

/**
 * Validates if the current session user actually exists in Supabase Auth
 * Returns true if session is valid, false if user was deleted but session remains cached
 */
export const validateSession = async (): Promise<{ 
  isValid: boolean; 
  session: any; 
  error?: string;
}> => {
  try {
    console.log("🔍 Validating session...");
    
    // Add timeout protection for session operations
    const sessionPromise = supabase.auth.getSession();
    const sessionTimeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Session fetch timeout')), 2000)
    );
    
    // Get the current session from localStorage/storage with timeout
    const { data: { session }, error: sessionError } = await Promise.race([
      sessionPromise,
      sessionTimeoutPromise
    ]) as any;
    
    if (sessionError) {
      console.error("❌ Error getting session:", sessionError);
      return { isValid: false, session: null, error: sessionError.message };
    }
    
    if (!session?.user) {
      console.log("ℹ️ No session found");
      return { isValid: false, session: null };
    }
    
    console.log("🔍 Session found for user:", session.user.id, "- validating user existence...");
    
    // Check if the user actually exists in Supabase Auth with timeout protection
    const userPromise = supabase.auth.getUser();
    const userTimeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('User validation timeout')), 2000)
    );
    
    const { data: userDetails, error: userError } = await Promise.race([
      userPromise,
      userTimeoutPromise
    ]) as any;
    
    if (userError || !userDetails?.user) {
      console.warn("⚠️ Session exists but user doesn't exist in Supabase Auth:", userError?.message || "User not found");
      console.log("🧹 Invalid session detected - user was likely deleted but session remained cached");
      return { 
        isValid: false, 
        session, 
        error: "Session invalid - user no longer exists" 
      };
    }
    
    // Double-check: Ensure the session user ID matches the retrieved user ID
    if (session.user.id !== userDetails.user.id) {
      console.warn("⚠️ Session user ID mismatch:", session.user.id, "vs", userDetails.user.id);
      return { 
        isValid: false, 
        session, 
        error: "Session user ID mismatch" 
      };
    }
    
    console.log("✅ Session is valid - user exists in Supabase Auth");
    return { isValid: true, session };
    
  } catch (error: any) {
    console.error("❌ Exception during session validation:", error);
    return { 
      isValid: false, 
      session: null, 
      error: error.message || "Unknown validation error" 
    };
  }
};

/**
 * Clears invalid session and redirects to auth page
 */
export const clearInvalidSession = async (): Promise<void> => {
  console.log("🧹 Clearing invalid session...");
  
  try {
    // Sign out to clear session properly
    await supabase.auth.signOut();
    
    // Clear localStorage and sessionStorage as backup
    localStorage.clear();
    sessionStorage.clear();
    
    console.log("✅ Invalid session cleared successfully");
    
  } catch (error: any) {
    console.error("❌ Error clearing session:", error);
    // Force clear storage even if signOut fails
    localStorage.clear();
    sessionStorage.clear();
  }
};

/**
 * Validates session and handles cleanup if invalid
 * Returns true if session is valid, false if invalid (and cleans up)
 */
export const validateAndCleanupSession = async (): Promise<{
  isValid: boolean;
  session: any;
  error?: string;
}> => {
  const validation = await validateSession();
  
  if (!validation.isValid && validation.session) {
    console.log("🧹 Invalid session detected, cleaning up...");
    await clearInvalidSession();
  }
  
  return validation;
};

/**
 * Enhanced session check that validates user existence with timeout protection
 * Use this instead of just checking supabase.auth.getSession()
 */
export const getValidSession = async (): Promise<{
  session: any;
  isValid: boolean;
  error?: string;
}> => {
  try {
    // Add timeout protection to prevent getting stuck in validation
    const validationPromise = validateAndCleanupSession();
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Session validation timeout')), 3000)
    );
    
    const validation = await Promise.race([validationPromise, timeoutPromise]) as any;
    
    return {
      session: validation.isValid ? validation.session : null,
      isValid: validation.isValid,
      error: validation.error
    };
  } catch (error: any) {
    console.error("❌ Session validation failed with timeout/error:", error);
    
    // If validation times out or fails, treat as invalid session
    return {
      session: null,
      isValid: false,
      error: error.message || "Session validation failed"
    };
  }
};