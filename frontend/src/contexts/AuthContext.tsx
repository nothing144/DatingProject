import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export interface Profile {
  id: string;
  name: string | null;
  username: string | null;
  age: number | null;
  location: string | null;
  description: string | null;
  shortBio: string | null;
  interests: string[] | null;
  avatar_url: string | null;
  photos: string[] | null;
  preferences: string | null;
  branch?: string | null;
  year?: number | null;
  email?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  isProfileComplete: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<Profile | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Safely clears only Supabase-related authentication tokens from storage.
 * Leaves all other origin storage (theme, local preferences, third-party data) intact.
 */
export const clearSupabaseStorage = () => {
  try {
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const key = localStorage.key(i);
      if (key && (key.startsWith('sb-') || key.includes('supabase.auth'))) {
        localStorage.removeItem(key);
      }
    }
    for (let i = sessionStorage.length - 1; i >= 0; i--) {
      const key = sessionStorage.key(i);
      if (key && (key.startsWith('sb-') || key.includes('supabase.auth'))) {
        sessionStorage.removeItem(key);
      }
    }
  } catch (e) {
    console.error("Error clearing Supabase storage:", e);
  }
};

/**
 * Checks if a profile has all mandatory fields filled
 */
export const checkProfileCompleteness = (data: Partial<Profile> | null): boolean => {
  if (!data) return false;

  const mandatoryFields: (keyof Profile)[] = [
    'name',
    'username',
    'age',
    'location',
    'shortBio',
    'avatar_url',
    'branch',
    'year'
  ];

  return mandatoryFields.every((field) => {
    const value = data[field];
    if (value === null || value === undefined) return false;
    if (typeof value === 'string' && value.trim() === '') return false;
    return true;
  });
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Fetch user profile from profiles table
  const fetchProfileData = useCallback(async (userId: string): Promise<Profile | null> => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error("Error loading user profile:", error);
        return null;
      }

      const userProfile = (data as Profile) || null;
      setProfile(userProfile);
      return userProfile;
    } catch (err) {
      console.error("Exception fetching profile:", err);
      return null;
    }
  }, []);

  const refreshProfile = useCallback(async (): Promise<Profile | null> => {
    if (!user) return null;
    return await fetchProfileData(user.id);
  }, [user, fetchProfileData]);

  // Safe signOut: cleans up Supabase tokens without wiping the entire browser localStorage
  const signOut = useCallback(async (): Promise<void> => {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.warn("Supabase signOut error:", err);
    } finally {
      clearSupabaseStorage();
      setUser(null);
      setSession(null);
      setProfile(null);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    let initialSessionProcessed = false;

    // Central application-level auth state listener
    // onAuthStateChange automatically fires an 'INITIAL_SESSION' event on load
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        console.log("🔐 Global Auth State Change:", event, newSession?.user?.id || "no-user");

        if (!isMounted) return;

        if (event === 'SIGNED_OUT') {
          clearSupabaseStorage();
          setSession(null);
          setUser(null);
          setProfile(null);
          setLoading(false);
          return;
        }

        if (newSession?.user) {
          // Avoid double fetching on initial load
          if (event === 'INITIAL_SESSION' && initialSessionProcessed) return;
          if (event === 'INITIAL_SESSION') initialSessionProcessed = true;

          // Only re-fetch profile if user changed, or was previously null, or explicitly signed in
          if (!profile || profile.id !== newSession.user.id || event === 'SIGNED_IN') {
            setLoading(true); // Prevent premature redirects while fetching profile
            
            setSession(newSession);
            setUser(newSession.user);
            
            console.log("onAuthStateChange: Getting profile...");
            // Do not await here to prevent Supabase auth lock deadlock
            fetchProfileData(newSession.user.id).then(() => {
              console.log("onAuthStateChange: Profile fetch complete");
              if (isMounted) {
                console.log("onAuthStateChange: Setting loading to false");
                setLoading(false);
              }
            });
          } else {
            if (isMounted) {
              console.log("onAuthStateChange: Setting loading to false (no fetch needed)");
              setLoading(false);
            }
          }
        } else if (!newSession) {
          setSession(null);
          setUser(null);
          setProfile(null);
          if (isMounted) setLoading(false);
        }
      }
    );

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchProfileData]);

  const isProfileComplete = useMemo(() => {
    return checkProfileCompleteness(profile);
  }, [profile]);

  const value = useMemo<AuthContextType>(() => ({
    user,
    session,
    profile,
    loading,
    isProfileComplete,
    signOut,
    refreshProfile
  }), [user, session, profile, loading, isProfileComplete, signOut, refreshProfile]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
