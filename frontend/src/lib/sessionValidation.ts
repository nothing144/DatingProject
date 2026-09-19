import { supabase } from "@/integrations/supabase/client";
import { Session } from "@supabase/supabase-js";
import { clearSupabaseStorage } from "@/contexts/AuthContext";

/**
 * Session validation utilities to handle cached sessions for deleted users.
 * Cleaned of fragile racing timeouts that cause false logouts on slow connections.
 */

/**
 * Validates if the current session user actually exists in Supabase Auth
 * Returns true if session is valid, false if user was deleted but session remains cached
 */
export const validateSession = async (): Promise<{ 
  isValid: boolean; 
  session: Session | null; 
  error?: string;
}> => {
  try {
    // 1. Get the current session from Supabase SDK
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error("❌ Error getting session:", sessionError);
      return { isValid: false, session: null, error: sessionError.message };
    }
    
    if (!session?.user) {
      return { isValid: false, session: null };
    }
    
    // 2. Verify with Supabase Auth that user still exists and token is valid
    const { data: userDetails, error: userError } = await supabase.auth.getUser();
    
    if (userError || !userDetails?.user) {
      console.warn("⚠️ Session exists but user doesn't exist in Supabase Auth:", userError?.message || "User not found");
      return { 
        isValid: false, 
        session, 
        error: "Session invalid - user no longer exists" 
      };
    }
    
    // 3. Ensure the session user ID matches the retrieved user ID
    if (session.user.id !== userDetails.user.id) {
      console.warn("⚠️ Session user ID mismatch:", session.user.id, "vs", userDetails.user.id);
      return { 
        isValid: false, 
        session, 
        error: "Session user ID mismatch" 
      };
    }
    
    return { isValid: true, session };
    
  } catch (error: Error | unknown) {
    console.error("❌ Exception during session validation:", error);
    return { 
      isValid: false, 
      session: null, 
      error: error instanceof Error ? error.message : "Unknown validation error" 
    };
  }
};

/**
 * Clears invalid session tokens safely without wiping unrelated browser localStorage
 */
export const clearInvalidSession = async (): Promise<void> => {
  console.log("🧹 Clearing invalid session safely...");
  
  try {
    await supabase.auth.signOut();
  } catch (error: unknown) {
    console.warn("Notice: signOut error during cleanup:", error);
  } finally {
    clearSupabaseStorage();
    console.log("✅ Invalid session tokens cleared safely");
  }
};

/**
 * Validates session and handles cleanup if invalid
 * Returns true if session is valid, false if invalid (and cleans up)
 */
export const validateAndCleanupSession = async (): Promise<{
  isValid: boolean;
  session: Session | null;
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
 * Enhanced session check that validates user existence
 * Preserved for backward compatibility across existing calls
 */
export const getValidSession = async (): Promise<{
  session: Session | null;
  isValid: boolean;
  error?: string;
}> => {
  try {
    const validation = await validateAndCleanupSession();
    return {
      session: validation.isValid ? validation.session : null,
      isValid: validation.isValid,
      error: validation.error
    };
  } catch (error: Error | unknown) {
    console.error("❌ Session validation failed:", error);
    return {
      session: null,
      isValid: false,
      error: error instanceof Error ? error.message : "Session validation failed"
    };
  }
};