import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import ProfileGrid from "@/components/ProfileGrid";
import Navigation from "@/components/Navigation";
import NotificationBell from "@/components/NotificationBell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { RotateCcw, Loader2, Heart } from "lucide-react";
import { toast } from "@/hooks/use-toast";

// Test page to verify pagination without authentication
const TestDiscover = () => {
  const [profiles, setProfiles] = useState<any[]>([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [totalProfiles, setTotalProfiles] = useState(0);
  const [searchUsername, setSearchUsername] = useState("");
  const PROFILES_PER_PAGE = 20;

  // Mock user ID for testing
  const mockUserId = "test-user-id";

  useEffect(() => {
    fetchProfiles();
  }, []);

  const fetchProfiles = async (usernameFilter?: string, append: boolean = false) => {
    try {
      const page = append ? currentPage : 0;
      const offset = page * PROFILES_PER_PAGE;

      console.log(`Fetching profiles: page=${page}, offset=${offset}, append=${append}`);

      let query = supabase
        .from("profiles")
        .select("*", { count: 'exact' });

      if (usernameFilter && usernameFilter.trim()) {
        query = query.ilike("username", `%${usernameFilter.trim()}%`);
      }

      const { data, error, count } = await query
        .order("created_at", { ascending: false })
        .range(offset, offset + PROFILES_PER_PAGE - 1);

      console.log("Query result:", { data, error, count });

      if (error) {
        console.error("Error fetching profiles:", error);
        toast({
          title: "Error",
          description: `Failed to load profiles: ${error.message}`,
          variant: "destructive"
        });
      } else {
        const fetchedProfiles = data || [];
        
        if (append) {
          setProfiles(prev => [...prev, ...fetchedProfiles]);
        } else {
          setProfiles(fetchedProfiles);
          setCurrentPage(0);
        }

        // Update pagination state
        setTotalProfiles(count || 0);
        setHasMore(fetchedProfiles.length === PROFILES_PER_PAGE && (offset + PROFILES_PER_PAGE) < (count || 0));
        
        // Show success message
        if (!append) {
          toast({
            title: "Profiles loaded!",
            description: `Found ${count || 0} profiles total, showing first ${Math.min(PROFILES_PER_PAGE, fetchedProfiles.length)}`
          });
        }
      }
    } catch (error) {
      console.error("Error fetching profiles:", error);
      toast({
        title: "Error",
        description: "Failed to load profiles",
        variant: "destructive"
      });
    }
  };

  const loadMoreProfiles = async () => {
    if (loadingMore || !hasMore) return;
    
    setLoadingMore(true);
    
    try {
      const nextPage = currentPage + 1;
      const offset = nextPage * PROFILES_PER_PAGE;

      console.log(`Loading more profiles: nextPage=${nextPage}, offset=${offset}`);

      let query = supabase
        .from("profiles")
        .select("*", { count: 'exact' });

      if (searchUsername && searchUsername.trim()) {
        query = query.ilike("username", `%${searchUsername.trim()}%`);
      }

      const { data, error, count } = await query
        .order("created_at", { ascending: false })
        .range(offset, offset + PROFILES_PER_PAGE - 1);

      if (error) {
        console.error("Error loading more profiles:", error);
        toast({
          title: "Error",
          description: `Failed to load more profiles: ${error.message}`,
          variant: "destructive"
        });
      } else {
        const fetchedProfiles = data || [];
        
        // Append new profiles
        setProfiles(prev => [...prev, ...fetchedProfiles]);
        setCurrentPage(nextPage);
        
        // Update hasMore state
        setHasMore(fetchedProfiles.length === PROFILES_PER_PAGE && (offset + PROFILES_PER_PAGE) < (count || 0));
        
        if (fetchedProfiles.length > 0) {
          toast({
            title: "More profiles loaded!",
            description: `Loaded ${fetchedProfiles.length} more profiles`
          });
        }
      }
    } catch (error) {
      console.error("Error loading more profiles:", error);
      toast({
        title: "Error",
        description: "Failed to load more profiles",
        variant: "destructive"
      });
    } finally {
      setLoadingMore(false);
    }
  };

  const handleUsernameSearch = () => {
    setCurrentPage(0);
    setHasMore(true);
    fetchProfiles(searchUsername);
  };

  const handleGridLike = (profileId: string) => {
    const updatedProfiles = profiles.filter(p => p.id !== profileId);
    setProfiles(updatedProfiles);
    
    toast({
      title: "Profile liked!",
      description: "Profile has been liked and removed from your discover feed."
    });
  };

  const handleGridPass = (profileId: string) => {
    const updatedProfiles = profiles.filter(p => p.id !== profileId);
    setProfiles(updatedProfiles);
    
    toast({
      title: "Profile passed",
      description: "Profile has been passed and removed from your discover feed."
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/20 via-background to-secondary/20 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5 animate-pulse"></div>
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-gradient-radial from-primary/20 to-transparent rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-gradient-radial from-secondary/20 to-transparent rounded-full blur-3xl animate-pulse"></div>
      
      <div className="container mx-auto p-4 max-w-7xl relative z-10 pb-24">
        {/* Header */}
        <div className="text-center mb-6 pt-4">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary via-accent to-secondary bg-clip-text text-transparent animate-pulse">
            ⚡ HeartBeat@Campus - TEST MODE ⚡
          </h1>
          <p className="text-muted-foreground text-sm bg-gradient-to-r from-secondary to-primary bg-clip-text text-transparent">
            Testing Pagination & Image Optimization
          </p>
        </div>

        {/* Discover Content */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Discover Profiles (Grid View Test)</h2>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => {
                setCurrentPage(0);
                setHasMore(true);
                fetchProfiles();
              }}
              className="flex items-center gap-2"
            >
              <RotateCcw className="h-4 w-4" />
              Refresh
            </Button>
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

          {/* Profile Grid */}
          <div className="space-y-4">
            {profiles.length > 0 ? (
              <>
                <ProfileGrid
                  profiles={profiles}
                  currentUserId={mockUserId}
                  onLike={handleGridLike}
                  onPass={handleGridPass}
                />
                
                {/* Load More Button */}
                {hasMore && (
                  <div className="flex justify-center pt-6">
                    <Button
                      onClick={loadMoreProfiles}
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
                
                {!hasMore && (
                  <div className="text-center py-6">
                    <Badge variant="outline" className="text-sm">
                      You've seen all {totalProfiles} profiles! 🎉
                    </Badge>
                  </div>
                )}
              </>
            ) : (
              <Card className="text-center p-8 animate-in fade-in-50 duration-500">
                <CardContent>
                  <Heart className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">No profiles found</h3>
                  <p className="text-muted-foreground">Check back later for new people!</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestDiscover;