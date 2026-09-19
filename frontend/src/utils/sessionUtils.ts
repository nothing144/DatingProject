import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { clearSupabaseStorage, checkProfileCompleteness } from "@/contexts/AuthContext";

export const getSession = async () => {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) {
      console.error("Session error:", error);
      return null;
    }
    return session;
  } catch (error) {
    console.error("Exception getting session:", error);
    return null;
  }
};

export const checkProfileComplete = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("id, name, username, age, location, shortBio, avatar_url, branch, year")
      .eq("id", userId)
      .single();

    if (error && error.code !== 'PGRST116') {
      return false;
    }

    if (!data) {
      return false;
    }

    return checkProfileCompleteness(data);
  } catch (error) {
    console.error("Error checking profile:", error);
    return false;
  }
};

export const signOutUser = async () => {
  try {
    // Targeted cleanup of Supabase tokens without wiping other application storage
    clearSupabaseStorage();
    
    // Sign out from Supabase
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      console.warn("Supabase signOut error:", error);
    }
    
    toast({
      title: "Logged Out Successfully! 👋",
      description: "You have been signed out safely."
    });
    
    window.location.href = "/auth";
  } catch (error) {
    console.error("Error during logout:", error);
    
    clearSupabaseStorage();
    
    toast({
      title: "Logged Out",
      description: "Session cleared. If you experience issues, please refresh the page.",
      variant: "destructive"
    });
    
    window.location.href = "/auth";
  }
};