import { useState, useEffect } from "react";

import { supabase } from "@/integrations/supabase/client";

import { useNavigate } from "react-router-dom";

import ProfileCard from "@/components/ProfileCard";
import ProfileGrid from "@/components/ProfileGrid";

import Navigation from "@/components/Navigation";

import NotificationBell from "@/components/NotificationBell";

import Chat from "@/components/Chat";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { Button } from "@/components/ui/button";

import { Input } from "@/components/ui/input";

import { Textarea } from "@/components/ui/textarea";

import { Badge } from "@/components/ui/badge";

import { MessageCircle, Calendar, Megaphone, User, RotateCcw, AlertTriangle, Heart, Loader2, Trash2, Sparkles } from "lucide-react";

import { toast } from "@/hooks/use-toast";

import { Alert, AlertDescription } from "@/components/ui/alert";

import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";



const Index = () => {

  const [user, setUser] = useState<any>(null);

  const [session, setSession] = useState<any>(null);

  const [activeTab, setActiveTab] = useState("discover");

  const [profiles, setProfiles] = useState<any[]>([]);

  const [allProfiles, setAllProfiles] = useState<any[]>([]);

  const [currentProfileIndex, setCurrentProfileIndex] = useState(0);

  const [viewMode, setViewMode] = useState<"single" | "grid">("grid"); // Default to grid view
  
  const [searchUsername, setSearchUsername] = useState("");

  const [announcements, setAnnouncements] = useState<any[]>([]);

  const [confessions, setConfessions] = useState<any[]>([]);

  const [conversations, setConversations] = useState<any[]>([]);

  const [newAnnouncement, setNewAnnouncement] = useState("");

  const [newConfession, setNewConfession] = useState("");

  const [dateRequests, setDateRequests] = useState<any[]>([]);

  const [loading, setLoading] = useState(true);

  const [selectedConversation, setSelectedConversation] = useState<any>(null);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [totalProfiles, setTotalProfiles] = useState(0);
  const PROFILES_PER_PAGE = 20;

  const navigate = useNavigate();



  // Listen for message events from ProfileCard

  useEffect(() => {

    const handleSwitchToMessages = (event: any) => {

      setActiveTab("messages");

      // Optionally auto-select the conversation

      setTimeout(() => {

        const conversation = conversations.find(c => c.id === event.detail.conversationId);

        if (conversation) {

          setSelectedConversation(conversation);

        }

      }, 100);

    };



    window.addEventListener('switchToMessages', handleSwitchToMessages);

    return () => window.removeEventListener('switchToMessages', handleSwitchToMessages);

  }, [conversations]);



  // Function to check if user has complete profile
  const checkUserProfileComplete = async (userId: string) => {
    // Prevent redirect loops by checking current location
    if (window.location.pathname !== '/') {
      return true; // Don't check if we're not on the main page
    }

    try {
      console.log("🔍 Checking profile completeness for user:", userId);
      
      const { data, error } = await supabase
        .from("profiles")
        .select("id, name, username, age, location, shortBio, avatar_url, branch, year")
        .eq("id", userId)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error("❌ Error checking profile:", error);
        return false;
      }

      // Check if user has complete profile (all mandatory fields filled)
      if (!data) {
        console.log("👤 No profile found - needs profile creation");
        return false;
      }

      const mandatoryFields = ['name', 'username', 'age', 'location', 'shortBio', 'avatar_url', 'branch', 'year'];
      const hasAllMandatoryFields = mandatoryFields.every(field => {
        const value = data[field];
        return value && (typeof value !== 'string' || value.trim() !== '');
      });

      if (!hasAllMandatoryFields) {
        console.log("📋 Incomplete profile - needs profile completion");
        return false;
      }

      console.log("✅ Profile is complete");
      return true;
    } catch (error) {
      console.error("❌ Exception checking profile:", error);
      return false;
    }
  };

useEffect(() => {
  let mounted = true;
  let authProcessing = false;

  const handleAuthStateChange = async (event: string, session: any) => {
    console.log("🔐 Auth state change in Index:", event, session?.user?.id || "no user");

    if (!mounted || authProcessing) return;
    authProcessing = true;

    try {
      setSession(session);
      setUser(session?.user || null);

      if (!session || event === "SIGNED_OUT") {
        console.log("👋 User signed out - redirecting to auth");
        // Clear all state
        setProfiles([]);
        setAllProfiles([]);
        setConversations([]);
        setAnnouncements([]);
        setConfessions([]);
        setDateRequests([]);
        setLoading(false);
        navigate("/auth", { replace: true });
      } 
      else if (session?.user) {
        console.log("🔍 User authenticated, checking profile...");
        
        const hasCompleteProfile = await checkUserProfileComplete(session.user.id);
        if (!hasCompleteProfile) {
          console.log("➡️ Redirecting to profile page for completion");
          setLoading(false);
          navigate("/profile", { replace: true });
          return;
        }
        
        console.log("✅ Profile complete - user can access main app");
        setLoading(false);
      }
    } catch (error) {
      console.error("❌ Error in auth state change:", error);
      setLoading(false);
    } finally {
      authProcessing = false;
    }
  };

  const { data: { subscription } } = supabase.auth.onAuthStateChange(handleAuthStateChange);

  // Initial session check
  const checkInitialSession = async () => {
    try {
      console.log("🔍 Checking initial session...");
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!mounted) return;

      // Only process if we don't already have a session
      if (!user && session?.user) {
        await handleAuthStateChange("INITIAL_SESSION", session);
      } else if (!session && !user) {
        console.log("❌ No session found - redirecting to auth");
        setLoading(false);
        navigate("/auth", { replace: true });
      } else if (user && session?.user) {
        // User already set, just clear loading
        console.log("✅ User already authenticated - clearing loading");
        setLoading(false);
      }
    } catch (error) {
      console.error("❌ Error checking initial session:", error);
      if (mounted) {
        setLoading(false);
        navigate("/auth", { replace: true });
      }
    }
  };

  checkInitialSession();

  return () => {
    mounted = false;
    subscription.unsubscribe();
  };
}, [user]); // Add user dependency

  // Safety net: ensure loading never hangs indefinitely
  useEffect(() => {
    if (!loading) return;
    const timeout = setTimeout(() => {
      console.warn("⚠️ Safety net: clearing loading state after timeout");
      setLoading(false);
    }, 5000); // Reduced from 8000 to 5000
    return () => clearTimeout(timeout);
  }, [loading]);

  useEffect(() => {

    if (user) {

      fetchProfiles();

      fetchAnnouncements();

      fetchConfessions();

      fetchConversations();

      fetchDateRequests();

    }

  }, [user]);

  // Auto-prefetch for single view when user gets close to end
  useEffect(() => {
    if (viewMode === "single" && profiles.length > 0 && hasMore) {
      const remainingProfiles = profiles.length - currentProfileIndex;
      // Pre-fetch when 5 profiles remain
      if (remainingProfiles <= 5 && !loadingMore) {
        loadMoreProfiles(true); // Silent load for single view
      }
    }
  }, [currentProfileIndex, profiles.length, viewMode, hasMore, loadingMore]);

  const fetchProfiles = async (usernameFilter?: string, append: boolean = false) => {
    try {
      console.log("📄 Fetching profiles...", { usernameFilter, append });
      
      const page = append ? currentPage : 0;
      const offset = page * PROFILES_PER_PAGE;

      let query = supabase
        .from("profiles")
        .select("*", { count: 'exact' })
        .neq("id", user?.id);

      if (usernameFilter && usernameFilter.trim()) {
        query = query.ilike("username", `%${usernameFilter.trim()}%`);
      }

      const { data, error, count } = await query
        .order("created_at", { ascending: false })
        .range(offset, offset + PROFILES_PER_PAGE - 1);

      if (error) {
        console.error("❌ Error fetching profiles:", error);
        toast({
          title: "Error",
          description: "Failed to load profiles",
          variant: "destructive"
        });
      } else {
        const fetchedProfiles = data || [];
        
        if (append) {
          setProfiles(prev => [...prev, ...fetchedProfiles]);
          setAllProfiles(prev => [...prev, ...fetchedProfiles]);
        } else {
          setProfiles(fetchedProfiles);
          setAllProfiles(fetchedProfiles);
          setCurrentProfileIndex(0);
          setCurrentPage(0);
        }

        // Update pagination state
        setTotalProfiles(count || 0);
        setHasMore(fetchedProfiles.length === PROFILES_PER_PAGE && (offset + PROFILES_PER_PAGE) < (count || 0));
        
        // Show success message with count (only for initial load or search)
        if (!append) {
          console.log("📄 Profiles loaded successfully:", fetchedProfiles.length);
          toast({
            title: "Profiles loaded!",
            description: `Found ${count || 0} profiles total, showing first ${Math.min(PROFILES_PER_PAGE, fetchedProfiles.length)}`
          });
        }
      }
    } catch (error) {
      console.error("❌ Exception fetching profiles:", error);
      toast({
        title: "Error",
        description: "Failed to load profiles",
        variant: "destructive"
      });
    }
  };

  const loadMoreProfiles = async (silent: boolean = false) => {
    if (loadingMore || !hasMore) return;
    
    setLoadingMore(true);
    
    try {
      const nextPage = currentPage + 1;
      const offset = nextPage * PROFILES_PER_PAGE;

      let query = supabase
        .from("profiles")
        .select("*", { count: 'exact' })
        .neq("id", user?.id);

      if (searchUsername && searchUsername.trim()) {
        query = query.ilike("username", `%${searchUsername.trim()}%`);
      }

      const { data, error, count } = await query
        .order("created_at", { ascending: false })
        .range(offset, offset + PROFILES_PER_PAGE - 1);

      if (error) {
        console.error("❌ Error loading more profiles:", error);
        if (!silent) {
          toast({
            title: "Error",
            description: "Failed to load more profiles",
            variant: "destructive"
          });
        }
      } else {
        const fetchedProfiles = data || [];
        
        // Append new profiles
        setProfiles(prev => [...prev, ...fetchedProfiles]);
        setAllProfiles(prev => [...prev, ...fetchedProfiles]);
        setCurrentPage(nextPage);
        
        // Update hasMore state
        setHasMore(fetchedProfiles.length === PROFILES_PER_PAGE && (offset + PROFILES_PER_PAGE) < (count || 0));
        
        if (!silent && fetchedProfiles.length > 0) {
          toast({
            title: "More profiles loaded!",
            description: `Loaded ${fetchedProfiles.length} more profiles`
          });
        }
      }
    } catch (error) {
      console.error("❌ Exception loading more profiles:", error);
      if (!silent) {
        toast({
          title: "Error",
          description: "Failed to load more profiles",
          variant: "destructive"
        });
      }
    } finally {
      setLoadingMore(false);
    }
  };



  const handleUsernameSearch = () => {
    console.log("🔍 Searching for username:", searchUsername);
    // Reset pagination for search
    setCurrentPage(0);
    setHasMore(true);
    fetchProfiles(searchUsername);
  };

  const handleGridLike = (profileId: string) => {
    // Remove liked profile from the grid
    const updatedProfiles = profiles.filter(p => p.id !== profileId);
    setProfiles(updatedProfiles);
    
    toast({
      title: "Profile liked!",
      description: "Profile has been liked and removed from your discover feed."
    });
  };

  const handleGridPass = (profileId: string) => {
    // Remove passed profile from the grid
    const updatedProfiles = profiles.filter(p => p.id !== profileId);
    setProfiles(updatedProfiles);
    
    toast({
      title: "Profile passed",
      description: "Profile has been passed and removed from your discover feed."
    });
  };

  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    console.log("🔄 Refreshing discover page...");
    setRefreshing(true);
    
    try {
      setCurrentPage(0);
      setHasMore(true);
      await fetchProfiles();
      setCurrentProfileIndex(0);
      
      toast({
        title: "Refreshed! ✨",
        description: "Discover page has been refreshed with latest profiles"
      });
    } catch (error) {
      toast({
        title: "Refresh failed",
        description: "Failed to refresh profiles. Please try again.",
        variant: "destructive"
      });
    } finally {
      setRefreshing(false);
    }
  };



  const fetchAnnouncements = async () => {

    const { data, error } = await supabase

      .from("announcements")

      .select(`

        *,

        profiles!fk_author_profile(name, avatar_url)

      `)

      .order("created_at", { ascending: false })

      .limit(10);



    if (error) {

      console.error("Error fetching announcements:", error);

    } else {

      setAnnouncements(data || []);

    }

  };



 const fetchConfessions = async () => {
  const { data, error } = await supabase
    .from("confessions")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching confessions:", error);
  } else {
    setConfessions(data || []);
  }
};

  const fetchConversations = async () => {

    const { data, error } = await supabase

      .from("conversations")

      .select(`

        *,

        participant_1_profile:profiles!conversations_participant_1_fkey(name, avatar_url),

        participant_2_profile:profiles!conversations_participant_2_fkey(name, avatar_url)

      `)

      .or(`participant_1.eq.${user?.id},participant_2.eq.${user?.id}`)

      .order("last_message_at", { ascending: false })

      .limit(20); // Limit conversations to reduce data usage



    if (error) {

      console.error("Error fetching conversations:", error);

    } else {

      setConversations(data || []);

    }

  };



  const fetchDateRequests = async () => {

    const { data, error } = await supabase

      .from("date_requests")

      .select(`

        *,

        sender:profiles!date_requests_sender_id_fkey(id, name, avatar_url),

        receiver:profiles!date_requests_receiver_id_fkey(id, name, avatar_url)

      `)

      .or(`sender_id.eq.${user?.id},receiver_id.eq.${user?.id}`)

      .order("created_at", { ascending: false });



    if (error) {

      console.error("Error fetching date requests:", error);

    } else {

      setDateRequests(data || []);

    }

  };



  const handleDateRequestResponse = async (requestId: string, status: 'accepted' | 'rejected') => {

    const { error } = await supabase

      .from("date_requests")

      .update({ status })

      .eq("id", requestId);



    if (error) {

      toast({

        title: "Error",

        description: error.message,

        variant: "destructive"

      });

    } else {

      fetchDateRequests();

      toast({

        title: status === 'accepted' ? "Request Accepted!" : "Request Rejected",

        description: `You have ${status} the date request`

      });

    }

  };

  const handleDeleteDateRequest = async (requestId: string) => {
    const { error } = await supabase
      .from("date_requests")
      .delete()
      .eq("id", requestId);

    if (error) {
      console.error("Error deleting date request:", error);
      console.error("Full error details:", JSON.stringify(error, null, 2));
      toast({
        title: "Database Error",
        description: `Failed to delete date request: ${error.message || 'Unknown error'}. Check console for details.`,
        variant: "destructive"
      });
    } else {
      fetchDateRequests();
      toast({
        title: "Date request deleted",
        description: "Request has been permanently removed to keep the database clean"
      });
    }
  };



  const handleLike = async () => {

    setCurrentProfileIndex(prev => prev + 1);

  };



  const handlePass = () => {

    setCurrentProfileIndex(prev => prev + 1);

  };



  const postAnnouncement = async () => {

    if (!newAnnouncement.trim()) return;



    const { error } = await supabase

      .from("announcements")

      .insert({

        content: newAnnouncement,

        author_id: user?.id

      });



    if (error) {

      toast({

        title: "Error",

        description: error.message,

        variant: "destructive"

      });

    } else {

      setNewAnnouncement("");

      fetchAnnouncements();

      toast({

        title: "Posted!",

        description: "Your announcement has been posted"

      });

    }

  };



  const postConfession = async () => {

    if (!newConfession.trim()) return;



    const { error } = await supabase

      .from("confessions")

      .insert({

        content: newConfession,

        author_id: user?.id

      });



    if (error) {

      toast({

        title: "Error",

        description: error.message,

        variant: "destructive"

      });

    } else {

      setNewConfession("");

      fetchConfessions();

      toast({

        title: "Posted!",

        description: "Your confession has been posted anonymously"

      });

    }

  };



  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center discover-bg relative overflow-hidden">
        {/* Enhanced Background Effects for Loading */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="floating-orb"></div>
          <div className="floating-orb"></div>
          <div className="floating-orb"></div>
        </div>
        
        <div className="text-center relative z-10">
          <div className="relative mb-8">
            <div className="absolute inset-0 bg-gradient-to-r from-primary via-accent to-secondary rounded-full blur-xl opacity-50 animate-pulse"></div>
            <div className="relative w-20 h-20 mx-auto bg-gradient-to-r from-primary via-accent to-secondary rounded-full flex items-center justify-center">
              <div className="w-10 h-10 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
            </div>
          </div>
          <div className="bg-black/20 backdrop-blur-sm px-6 py-3 rounded-full border border-white/10">
            <p className="text-white/90 font-medium">Loading your world of connections...</p>
          </div>
        </div>
      </div>
    );
  }



  if (!user) {

    return null;

  }



  const currentProfile = profiles[currentProfileIndex];



  // Dynamic background class based on active tab
  const getBackgroundClass = () => {
    switch(activeTab) {
      case "discover": return "discover-bg";
      case "messages": return "messages-bg";
      case "announcements": return "announcements-bg";
      case "date-requests": return "date-requests-bg";
      case "profile": return "profile-bg";
      default: return "discover-bg";
    }
  };

  return (

    <div className={`min-h-screen ${getBackgroundClass()} relative overflow-hidden transition-all duration-1000`}>

      {/* Enhanced Dynamic Background Effects */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Floating Orbs */}
        <div className="floating-orb"></div>
        <div className="floating-orb"></div>
        <div className="floating-orb"></div>
        
        {/* Particle Effects */}
        {[...Array(12)].map((_, i) => (
          <div
            key={i}
            className="particle"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${i * 0.5}s`,
            }}
          />
        ))}
      </div>

    <div className="container mx-auto p-4 max-w-7xl relative z-10 pb-24">
        {/* Glass morphism overlay for better content readability */}
        <div className="absolute inset-0 bg-black/10 backdrop-blur-[1px] rounded-3xl pointer-events-none"></div>
        
        <div className="relative z-10">



        {/* Enhanced Header with dynamic styling */}
        <div className="text-center mb-6 pt-4 relative z-10">
          <div className="flex items-center justify-between mb-4">
            <div className="w-8"></div>
            
            {/* Dynamic Logo with enhanced interactions */}
            <div className="relative group cursor-pointer">
              <div className="absolute inset-0 bg-gradient-to-r from-primary via-accent to-secondary rounded-full blur-xl opacity-50 group-hover:opacity-100 group-active:opacity-100 transition-all duration-500 animate-pulse group-hover:scale-110 group-active:scale-110"></div>
              <h1 className="relative text-4xl font-bold bg-gradient-to-r from-primary via-accent to-secondary bg-clip-text text-transparent animate-pulse hover:animate-none active:animate-none logo-glow transition-all duration-300">
                ⚡ HeartBeat@ITER 
              </h1>
            </div>
            
            <NotificationBell userId={user.id} />
          </div>
          
          <div className="bg-black/20 backdrop-blur-sm px-4 py-2 rounded-full inline-block border border-white/10">
            <p className="text-white/90 text-sm bg-gradient-to-r from-white to-white/80 bg-clip-text text-transparent font-medium">
              College ka pyaar, semester jaisa — short & intense
            </p>
          </div>
        </div>

        {/* Navigation Component - Critical for logout functionality */}
        <Navigation activeTab={activeTab} onTabChange={setActiveTab} />

        {/* Content based on active tab */}
        {activeTab === "discover" && (
          <div className="space-y-4 bg-black/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Discover</h2>
              <div className="flex items-center gap-2">
                {/* View Mode Toggle */}
                <div className="flex rounded-lg border border-border p-1">
                  <Button
                    variant={viewMode === "grid" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setViewMode("grid")}
                    className="h-8 px-3"
                  >
                    Grid
                  </Button>
                  <Button
                    variant={viewMode === "single" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setViewMode("single")}
                    className="h-8 px-3"
                  >
                    Single
                  </Button>
                </div>
                
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleRefresh}
                  disabled={refreshing}
                  className="flex items-center gap-2 border-primary/30 hover:border-primary hover:bg-primary/10 text-primary transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <RotateCcw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                  <span className="font-medium">{refreshing ? 'Refreshing...' : 'Refresh'}</span>
                </Button>
              </div>
            </div>

            {/* Profile count indicator */}
            {profiles.length > 0 && (
              <div className="text-center">
                <Badge variant="secondary" className="text-sm">
                  {profiles.length} of {totalProfiles} profile{totalProfiles !== 1 ? 's' : ''} loaded
                </Badge>
              </div>
            )}

            {/* Username Search */}
            <div className="flex gap-2">
              <Input
                placeholder="Search by username..."
                value={searchUsername}
                onChange={(e) => setSearchUsername(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleUsernameSearch()}
                className="flex-1 border-accent/30 focus:border-accent focus:ring-accent"
              />
              <Button
                onClick={handleUsernameSearch}
                variant="outline"
                className="border-accent hover:bg-accent hover:text-accent-foreground"
              >
                Search
              </Button>
              {searchUsername && (
                <Button
                  onClick={() => {
                    setSearchUsername("");
                    setCurrentPage(0);
                    setHasMore(true);
                    fetchProfiles();
                  }}
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground hover:text-foreground"
                >
                  Clear
                </Button>
              )}
            </div>

            {/* Profile Display */}
            {viewMode === "grid" ? (
              <div className="space-y-4">
                <ProfileGrid
                  profiles={profiles}
                  currentUserId={user.id}
                  onLike={handleGridLike}
                  onPass={handleGridPass}
                />
                
                {/* Load More Button for Grid View */}
                {hasMore && profiles.length > 0 && (
                  <div className="flex justify-center pt-6">
                    <Button
                      onClick={() => loadMoreProfiles()}
                      disabled={loadingMore}
                      variant="outline"
                      size="lg"
                      className="min-w-[200px] border-primary/50 hover:bg-primary hover:text-primary-foreground"
                    >
                      {loadingMore ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Loading More...
                        </>
                      ) : (
                        `Load More Profiles (${Math.min(PROFILES_PER_PAGE, totalProfiles - profiles.length)} remaining)`
                      )}
                    </Button>
                  </div>
                )}
                
                {!hasMore && profiles.length > 0 && (
                  <div className="text-center py-6">
                    <Badge variant="outline" className="text-sm">
                      You've seen all {totalProfiles} profiles! 🎉
                    </Badge>
                  </div>
                )}
              </div>
            ) : (
              currentProfile ? (
                <ProfileCard
                  key={`${currentProfile.id}-${currentProfileIndex}`}
                  profile={currentProfile}
                  currentUserId={user.id}
                  onLike={handleLike}
                  onPass={handlePass}
                />
              ) : (
                <Card className="text-center p-8 animate-in fade-in-50 duration-500">
                  <CardContent>
                    <Heart className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-lg font-semibold mb-2">No more profiles</h3>
                    <p className="text-muted-foreground">Check back later for new people!</p>
                  </CardContent>
                </Card>
              )
            )}

            {/* Loading indicator for automatic prefetch in single view */}
            {viewMode === "single" && loadingMore && (
              <div className="fixed bottom-24 right-4 bg-background/80 backdrop-blur-sm rounded-full p-2 border">
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
              </div>
            )}
          </div>
        )}



        {activeTab === "messages" && (

          selectedConversation ? (

            <Chat

              conversationId={selectedConversation.id}

              otherUser={selectedConversation.participant_1 === user?.id 

                ? { id: selectedConversation.participant_2, ...selectedConversation.participant_2_profile }

                : { id: selectedConversation.participant_1, ...selectedConversation.participant_1_profile }

              }

              currentUserId={user.id}

              onBack={() => setSelectedConversation(null)}

            />

          ) : (

            <div className="space-y-4 bg-black/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">

              <Alert className="border-slate-700 bg-slate-950/50">

                <AlertTriangle className="h-4 w-4 text-amber-400" />

                <AlertDescription className="text-slate-300">

                  <strong>🚨 Community Notice:</strong> To keep the community running on a free plan, we need to reduce database load.
                  <br />
                  <span className="text-red-400 font-medium">💡 Important:</span> If your date request has been accepted, please exchange contact details and delete your profile after that. You can always come back later by signing in again and creating a new profile.
                  <br />
                  <span className="text-blue-400">📱 Quick tip:</span> Exchange contact details and move to WhatsApp/Instagram for better communication.

                </AlertDescription>

              </Alert>

              

              <div className="flex items-center justify-between mb-4">

                <h2 className="text-xl font-semibold">Messages</h2>

                <Button 

                  variant="outline" 

                  size="sm"

                  onClick={() => {

                    fetchConversations();

                    toast({ title: "Messages refreshed!" });

                  }}

                  className="flex items-center gap-2"

                >

                  <RotateCcw className="h-4 w-4" />

                  Refresh

                </Button>

              </div>

              {conversations.length > 0 ? (

                conversations.map((conversation) => {

                  const otherUser = conversation.participant_1 === user?.id 

                    ? conversation.participant_2_profile 

                    : conversation.participant_1_profile;

                  

                  return (

                    <Card 

                      key={conversation.id} 

                      className="cursor-pointer hover:shadow-md transition-shadow"

                      onClick={() => setSelectedConversation(conversation)}

                    >

                      <CardContent className="p-4">

                        <div className="flex items-center gap-3">

                          <img

                            src={otherUser?.avatar_url || "/placeholder.svg"}

                            alt={otherUser?.name}

                            className="w-12 h-12 rounded-full object-cover"

                          />

                          <div className="flex-1">

                            <h3 className="font-semibold">{otherUser?.name}</h3>

                            <p className="text-sm text-muted-foreground">Tap to chat</p>

                          </div>

                          <MessageCircle className="w-5 h-5 text-muted-foreground" />

                        </div>

                      </CardContent>

                    </Card>

                  );

                })

              ) : (

                <Card className="text-center p-8">

                  <CardContent>

                    <MessageCircle className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />

                    <h3 className="text-lg font-semibold mb-2">No conversations yet</h3>

                    <p className="text-muted-foreground">Start by liking someone's profile!</p>

                  </CardContent>

                </Card>

              )}

            </div>

          )

        )}



        {activeTab === "announcements" && (

          <div className="space-y-4 bg-black/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">

            <div className="flex items-center justify-between mb-4">

              <h2 className="text-xl font-semibold">Campus Life</h2>

              <Button 

                variant="outline" 

                size="sm"

                onClick={() => {

                  fetchAnnouncements();

                  fetchConfessions();

                  toast({ title: "Feed refreshed!" });

                }}

                className="flex items-center gap-2"

              >

                <RotateCcw className="h-4 w-4" />

                Refresh

              </Button>

            </div>

            

            {/* Post new announcement */}

            <Card>

              <CardHeader>

                <CardTitle className="text-lg">Make an Announcement</CardTitle>

              </CardHeader>

              <CardContent className="space-y-3">

                <Textarea

                  placeholder="What's happening on campus?"

                  value={newAnnouncement}

                  onChange={(e) => setNewAnnouncement(e.target.value)}

                />

                <Button onClick={postAnnouncement} className="w-full">

                  Post Announcement

                </Button>

              </CardContent>

            </Card>



            {/* Post new confession */}

            <Card>

              <CardHeader>

                <CardTitle className="text-lg">Anonymous Confession</CardTitle>

              </CardHeader>

              <CardContent className="space-y-3">

                <Textarea

                  placeholder="Share your secret... (completely anonymous)"

                  value={newConfession}

                  onChange={(e) => setNewConfession(e.target.value)}

                />

                <Button onClick={postConfession} className="w-full" variant="secondary">

                  Post Anonymously

                </Button>

              </CardContent>

            </Card>

            

            {/* Display announcements */}

            <div className="space-y-4">

              <h3 className="text-lg font-semibold">📢 Campus Announcements</h3>

              {announcements.map((announcement) => (

                <Card key={announcement.id}>

                  <CardContent className="p-4">

                    <div className="flex items-start gap-3">

                      <img 

                        src={announcement.profiles?.avatar_url || "/placeholder.svg"} 

                        alt={announcement.profiles?.name || "User"}

                        className="w-10 h-10 rounded-full object-cover"

                      />

                      <div className="flex-1">

                        <div className="flex items-center gap-2 mb-2">

                          <span className="font-semibold">{announcement.profiles?.name || "Anonymous"}</span>

                          <Badge variant="outline" className="text-xs">

                            <Megaphone className="w-3 h-3 mr-1" />

                            Announcement

                          </Badge>

                        </div>

                        <p className="text-sm">{announcement.content}</p>

                        <p className="text-xs text-muted-foreground mt-2">

                          {new Date(announcement.created_at).toLocaleDateString()}

                        </p>

                      </div>

                    </div>

                  </CardContent>

                </Card>

              ))}

            </div>

            

            {/* Display confessions */}

            <div className="space-y-4">

              <h3 className="text-lg font-semibold">🤫 Anonymous Confessions</h3>

              {confessions.map((confession) => (

                <Card key={confession.id} className="border-dashed">

                  <CardContent className="p-4">

                    <div className="flex items-start gap-3">

                      <div className="w-10 h-10 rounded-full bg-secondary/20 flex items-center justify-center">

                        <User className="w-5 h-5 text-secondary" />

                      </div>

                      <div className="flex-1">

                        <div className="flex items-center gap-2 mb-2">

                          <span className="font-semibold text-secondary">Anonymous</span>

                          <Badge variant="secondary" className="text-xs">

                            Confession

                          </Badge>

                        </div>

                        <p className="text-sm italic">{confession.content}</p>

                        <p className="text-xs text-muted-foreground mt-2">

                          {new Date(confession.created_at).toLocaleDateString()}

                        </p>

                      </div>

                    </div>

                  </CardContent>

                </Card>

              ))}

            </div>

          </div>

        )}



        {activeTab === "date-requests" && (

          <div className="space-y-4 bg-black/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">

            <div className="flex items-center justify-between mb-4">

              <h2 className="text-xl font-semibold">Date Requests</h2>

              <Button 

                variant="outline" 

                size="sm"

                onClick={() => {

                  fetchDateRequests();

                  toast({ title: "Date requests refreshed!" });

                }}

                className="flex items-center gap-2"

              >

                <RotateCcw className="h-4 w-4" />

                Refresh

              </Button>

            </div>

            

            {dateRequests.length > 0 ? (

              <div className="space-y-4">

                {dateRequests.map((request) => {

                  const isReceiver = request.receiver_id === user.id;

                  const otherUser = isReceiver ? request.sender : request.receiver;

                  

                  return (

                    <Card key={request.id}>

                      <CardContent className="p-4">

                        <div className="flex items-center justify-between">

                          <div className="flex items-center gap-3">

                            <img

                              src={otherUser?.avatar_url || "/placeholder.svg"}

                              alt={otherUser?.name}

                              className="w-12 h-12 rounded-full object-cover"

                            />

                            <div>

                              <h3 className="font-semibold">{otherUser?.name}</h3>

                              <p className="text-sm text-muted-foreground">

                                {isReceiver ? "Sent you a date request" : "You sent a date request"}

                              </p>

                              <div className="flex items-center gap-2 mt-1">

                                <Calendar className="w-4 h-4 text-muted-foreground" />

                                <span className="text-xs text-muted-foreground">

                                  {new Date(request.created_at).toLocaleDateString()}

                                </span>

                                <Badge 

                                  variant={

                                    request.status === 'accepted' ? 'default' : 

                                    request.status === 'rejected' ? 'destructive' : 

                                    'secondary'

                                  }

                                  className="text-xs"

                                >

                                  {request.status}

                                </Badge>

                              </div>

                            </div>

                          </div>

                          

                          <div className="flex items-center gap-2">

                            {isReceiver && request.status === 'pending' && (

                              <>

                                <Button

                                  size="sm"

                                  onClick={() => handleDateRequestResponse(request.id, 'accepted')}

                                  className="bg-green-600 hover:bg-green-700"

                                >

                                  Accept

                                </Button>

                                <Button

                                  size="sm"

                                  variant="destructive"

                                  onClick={() => handleDateRequestResponse(request.id, 'rejected')}

                                >

                                  Reject

                                </Button>

                              </>

                            )}

                            

                            {(request.status === 'accepted' || request.status === 'rejected') && (

                              <AlertDialog>

                                <AlertDialogTrigger asChild>

                                  <Button

                                    size="sm"

                                    variant="outline"

                                    className="text-red-600 border-red-600 hover:bg-red-50"

                                  >

                                    <Trash2 className="w-4 h-4 mr-1" />

                                    Delete

                                  </Button>

                                </AlertDialogTrigger>

                                <AlertDialogContent>

                                  <AlertDialogHeader>

                                    <AlertDialogTitle>Delete Date Request</AlertDialogTitle>

                                    <AlertDialogDescription>

                                      This will permanently delete this date request from the database. This action cannot be undone.

                                    </AlertDialogDescription>

                                  </AlertDialogHeader>

                                  <AlertDialogFooter>

                                    <AlertDialogCancel>Cancel</AlertDialogCancel>

                                    <AlertDialogAction

                                      onClick={() => handleDeleteDateRequest(request.id)}

                                      className="bg-red-600 hover:bg-red-700"

                                    >

                                      Delete

                                    </AlertDialogAction>

                                  </AlertDialogFooter>

                                </AlertDialogContent>

                              </AlertDialog>

                            )}

                          </div>

                        </div>

                      </CardContent>

                    </Card>

                  );

                })}

              </div>

            ) : (

              <Card className="text-center p-8">

                <CardContent>

                  <Calendar className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />

                  <h3 className="text-lg font-semibold mb-2">No date requests</h3>

                  <p className="text-muted-foreground">Date requests will appear here when someone likes your profile!</p>

                </CardContent>

              </Card>

            )}

          </div>

        )}

        {/* Profile Tab - Navigate to Profile Edit Page */}
        {activeTab === "profile" && (
          <div className="space-y-4 bg-black/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
            <div className="text-center space-y-6">
              <div className="flex justify-center items-center mb-4">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-primary to-secondary rounded-full blur-lg opacity-50 animate-pulse"></div>
                  <div className="relative bg-gradient-to-r from-primary to-secondary p-3 rounded-full">
                    <User className="w-8 h-8 text-white" />
                  </div>
                </div>
              </div>
              
              <div>
                <h2 className="text-2xl font-bold mb-2">Your Profile</h2>
                <p className="text-muted-foreground">Manage your profile information and preferences</p>
              </div>
              
              <div className="space-y-4">
                <Button 
                  onClick={() => navigate("/profile")}
                  className="btn-primary-enhanced w-full max-w-sm mx-auto py-3 text-base font-semibold"
                >
                  <User className="w-5 h-5 mr-2" />
                  Edit Profile
                </Button>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-md mx-auto">
                  <div className="bg-card/50 backdrop-blur-sm rounded-lg p-4 border border-border/30">
                    <div className="flex items-center gap-3 mb-2">
                      <Heart className="w-5 h-5 text-primary" />
                      <span className="font-semibold">Profile Status</span>
                    </div>
                    <p className="text-sm text-muted-foreground">Keep your profile updated to get better matches!</p>
                  </div>
                  
                  <div className="bg-card/50 backdrop-blur-sm rounded-lg p-4 border border-border/30">
                    <div className="flex items-center gap-3 mb-2">
                      <Sparkles className="w-5 h-5 text-secondary" />
                      <span className="font-semibold">Visibility</span>
                    </div>
                    <p className="text-sm text-muted-foreground">Your profile is visible to other students</p>
                  </div>
                </div>
                
                <div className="text-center pt-4">
                  <p className="text-sm text-muted-foreground">
                    💡 Tip: Complete profiles get 3x more matches!
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        </div>

    </div>

    <Navigation activeTab={activeTab} onTabChange={setActiveTab} />

    </div>

  );

};

export default Index;