import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

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

    const mandatoryFields = ['name', 'username', 'age', 'location', 'shortBio', 'avatar_url', 'branch', 'year'];
    const hasAllMandatoryFields = mandatoryFields.every(field => {
      const value = data[field];
      return value && (typeof value !== 'string' || value.trim() !== '');
    });

    return hasAllMandatoryFields;
  } catch (error) {
    console.error("Error checking profile:", error);
    return false;
  }
};

export const signOutUser = async () => {
  try {
    // Clear local storage first
    localStorage.clear();
    sessionStorage.clear();
    
    // Sign out from Supabase
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      console.warn("Supabase signOut error:", error);
    }
    
    toast({
      title: "Logged Out Successfully! 👋",
      description: "You have been signed out safely."
    });
    
    // Force page reload to clear any cached state
    window.location.href = "/auth";
  } catch (error) {
    console.error("Error during logout:", error);
    
    // Clear storage anyway
    localStorage.clear();
    sessionStorage.clear();
    
    toast({
      title: "Logged Out",
      description: "Session cleared. If you experience issues, please refresh the page.",
      variant: "destructive"
    });
    
    window.location.href = "/auth";
  }
};