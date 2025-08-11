import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Heart, MessageCircle, MapPin, User, Eye } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

interface Profile {
  id: string;
  name: string;
  username?: string;
  age?: number;
  location?: string;
  description?: string;
  shortBio?: string;
  interests?: string[];
  photos?: string[];
  avatar_url?: string;
}

interface ProfileGridProps {
  profiles: Profile[];
  currentUserId: string;
  onLike: (profileId: string) => void;
  onPass: (profileId: string) => void;
}

const ProfileGrid = ({ profiles, currentUserId, onLike, onPass }: ProfileGridProps) => {
  const [loading, setLoading] = useState<{ [key: string]: boolean }>({});
  const navigate = useNavigate();

  const handleMessage = async (profile: Profile) => {
    if (loading[profile.id]) return;
    
    setLoading(prev => ({ ...prev, [profile.id]: true }));
    
    try {
      const { data: existingConversation, error: fetchError } = await supabase
        .rpc('get_or_create_conversation', {
          user1: currentUserId,
          user2: profile.id
        });

      if (fetchError) throw fetchError;

      // Dispatch custom event to switch to messages tab
      window.dispatchEvent(new CustomEvent('switchToMessages', {
        detail: { conversationId: existingConversation }
      }));

      toast({
        title: "Success!",
        description: `Started conversation with ${profile.name}!`
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to start conversation",
        variant: "destructive"
      });
    } finally {
      setLoading(prev => ({ ...prev, [profile.id]: false }));
    }
  };

  const handleDateRequest = async (profile: Profile) => {
    if (loading[profile.id]) return;
    
    setLoading(prev => ({ ...prev, [profile.id]: true }));
    
    try {
      const { error } = await supabase
        .from('date_requests')
        .insert({
          sender_id: currentUserId,
          receiver_id: profile.id,
          status: 'pending'
        });

      if (error) {
        if (error.code === '23505') { // Unique constraint violation
          toast({
            title: "Already Sent",
            description: "You've already sent a date request to this person",
            variant: "destructive"
          });
          setLoading(prev => ({ ...prev, [profile.id]: false }));
          return;
        } else {
          throw error;
        }
      } else {
        toast({
          title: "Date request sent!",
          description: `Your date request has been sent to ${profile.name}!`
        });
        
        // Create notification for the receiver
        await supabase.rpc('create_notification', {
          target_user_id: profile.id,
          notification_type: 'date_request',
          notification_title: 'New Date Request',
          notification_message: `Someone sent you a date request!`
        });
      }

      onLike(profile.id);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to send date request",
        variant: "destructive"
      });
    } finally {
      setLoading(prev => ({ ...prev, [profile.id]: false }));
    }
  };

  if (profiles.length === 0) {
    return (
      <div className="text-center py-12">
        <User className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-foreground mb-2">No profiles found</h3>
        <p className="text-muted-foreground">Try refreshing or adjusting your search.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 p-2 sm:p-4">
      {profiles.map((profile) => (
        <Card key={profile.id} className="relative overflow-hidden bg-card/50 backdrop-blur-sm border-primary/20 hover:border-primary/40 transition-all duration-300 hover:shadow-[0_0_20px_hsl(var(--primary)/0.3)] group">
          <CardContent className="p-3 sm:p-4">
            {/* Profile Image */}
            <div className="relative w-full h-40 sm:h-48 mb-3 sm:mb-4 rounded-lg overflow-hidden bg-gradient-to-br from-primary/20 via-secondary/20 to-accent/20">
              {profile.avatar_url || (profile.photos && profile.photos[0]) ? (
                <img
                  src={profile.avatar_url || profile.photos?.[0]}
                  alt={profile.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.name)}&background=random&color=fff&size=400`;
                  }}
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-primary/30 to-secondary/30">
                  <User className="h-12 w-12 sm:h-16 sm:w-16 text-white/80 mb-2" />
                  <span className="text-white/60 text-sm font-medium">{profile.name}</span>
                </div>
              )}
              
              {/* Quick action overlay */}
              <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-2 sm:gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  className="bg-white/10 border-white/30 text-white hover:bg-white/20 text-xs sm:text-sm px-2 sm:px-3"
                  onClick={() => onPass(profile.id)}
                >
                  Pass
                </Button>
                <Button
                  variant="outline" 
                  size="sm"
                  className="bg-pink-500/90 border-pink-500/60 text-white hover:bg-pink-500 text-xs sm:text-sm px-2 sm:px-3"
                  onClick={() => handleDateRequest(profile)}
                  disabled={loading[profile.id]}
                >
                  <Heart className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                  Like
                </Button>
              </div>
            </div>

            {/* Profile Info */}
            <div className="space-y-2 sm:space-y-3">
              {/* Name and Age */}
              <div className="flex items-center justify-between">
                <h3 className="text-base sm:text-lg font-semibold text-pink-400 truncate">
                  {profile.name}
                  {profile.age && <span className="text-pink-300">, {profile.age}</span>}
                </h3>
                {profile.username && (
                  <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded flex-shrink-0 ml-2">
                    @{profile.username}
                  </span>
                )}
              </div>

              {/* Location */}
              {profile.location && (
                <div className="flex items-center gap-1 text-xs sm:text-sm text-muted-foreground">
                  <MapPin className="h-3 w-3 flex-shrink-0" />
                  <span className="truncate">{profile.location}</span>
                </div>
              )}

              {/* Bio - Mobile optimized */}
              {profile.shortBio && (
                <div className="sm:block">
                  <span className="text-xs sm:text-sm font-semibold text-secondary">Bio: </span>
                  <span className="text-xs sm:text-sm text-muted-foreground line-clamp-2 sm:line-clamp-3">{profile.shortBio}</span>
                </div>
              )}

              {/* Description - Hidden on small mobile, visible on larger screens */}
              {profile.description && (
                <div className="hidden sm:block">
                  <span className="text-sm font-semibold text-accent">About: </span>
                  <span className="text-sm text-muted-foreground line-clamp-2">{profile.description}</span>
                </div>
              )}

              {/* Interests */}
              {profile.interests && profile.interests.length > 0 && (
                <div>
                  <span className="text-xs sm:text-sm font-semibold text-secondary mb-1 sm:mb-2 block">Interests:</span>
                  <div className="flex flex-wrap gap-1">
                    {profile.interests.slice(0, 2).map((interest, index) => (
                      <Badge key={index} variant="secondary" className="text-xs px-2 py-1">
                        {interest}
                      </Badge>
                    ))}
                    {profile.interests.length > 2 && (
                      <Badge variant="outline" className="text-xs px-2 py-1">
                        +{profile.interests.length - 2}
                      </Badge>
                    )}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex justify-center gap-2 sm:gap-3 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 border-secondary/50 hover:bg-secondary hover:text-secondary-foreground text-xs sm:text-sm py-2"
                  onClick={() => handleMessage(profile)}
                  disabled={loading[profile.id]}
                >
                  <MessageCircle className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                  Message
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 border-primary/50 text-pink-500 hover:bg-pink-500 hover:text-white text-xs sm:text-sm py-2"
                  onClick={() => handleDateRequest(profile)}
                  disabled={loading[profile.id]}
                >
                  <Heart className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                  Like
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default ProfileGrid;