import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Heart, MessageCircle, MapPin, User, Eye, Zap, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { getThumbnailUrl, getFallbackAvatarUrl } from "@/lib/imageUtils";

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
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);
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

      window.dispatchEvent(new CustomEvent('switchToMessages', {
        detail: { conversationId: existingConversation }
      }));

      toast({
        title: "Conversation Started! 💬",
        description: `Ready to chat with ${profile.name}!`
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
        if (error.code === '23505') {
          toast({
            title: "Already Sent! 💕",
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
          title: "Date Request Sent! ✨",
          description: `Your request has been sent to ${profile.name}!`
        });
        
        await supabase.rpc('create_notification', {
          target_user_id: profile.id,
          notification_type: 'date_request',
          notification_title: 'New Date Request',
          notification_message: `Someone sent you a date request! 💕`
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
      <div className="text-center py-16 animate-fadeInUp">
        <div className="relative">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
            <User className="h-10 w-10 text-muted-foreground" />
          </div>
          <h3 className="heading-secondary mb-4">No profiles found</h3>
          <p className="text-muted-foreground max-w-sm mx-auto leading-relaxed">
            Try refreshing or adjusting your search to discover more amazing people! ⚡
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid-responsive animate-fadeInUp">
      {profiles.map((profile, index) => (
        <Card 
          key={profile.id} 
          className="card-enhanced group cursor-pointer transform transition-all duration-500"
          style={{ 
            animationDelay: `${index * 0.1}s`,
            animation: `fadeInUp 0.6s ease-out ${index * 0.1}s both`
          }}
          onMouseEnter={() => setHoveredCard(profile.id)}
          onMouseLeave={() => setHoveredCard(null)}
        >
          <CardContent className="p-4">
            {/* Enhanced Profile Image Section */}
            <div className="profile-image mb-4 cursor-pointer relative overflow-hidden rounded-[var(--radius-lg)]"
                 onClick={() => navigate(`/profile/${profile.id}`)}>
              
              {profile.avatar_url || (profile.photos && profile.photos[0]) ? (
                <img
                  src={getThumbnailUrl(profile.avatar_url || profile.photos?.[0] || '')}
                  alt={profile.name}
                  className="w-full h-full object-cover transition-all duration-500"
                  loading="lazy"
                  onError={(e) => {
                    e.currentTarget.src = getFallbackAvatarUrl(profile.name || 'User', 400);
                  }}
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-primary/30 via-secondary/20 to-accent/30 text-white">
                  <User className="h-12 w-12 sm:h-16 sm:w-16 mb-3 opacity-80" />
                  <span className="text-sm sm:text-base font-medium opacity-90">{profile.name}</span>
                </div>
              )}
              
              {/* Enhanced View Profile Overlay */}
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                <div className="bg-white/20 backdrop-blur-md rounded-full p-3 transform scale-0 group-hover:scale-100 transition-transform duration-300">
                  <Eye className="h-6 w-6 text-white" />
                </div>
              </div>
              
              {/* Action Buttons Overlay */}
              <div className="absolute inset-x-4 bottom-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-4 group-hover:translate-y-0">
                <Button
                  size="sm"
                  className="flex-1 bg-red-500/90 backdrop-blur-md hover:bg-red-500 text-white border-0 text-xs font-medium rounded-full py-2"
                  onClick={(e) => {
                    e.stopPropagation();
                    onPass(profile.id);
                  }}
                >
                  Pass
                </Button>
                <Button
                  size="sm"
                  className="flex-1 bg-green-500/90 backdrop-blur-md hover:bg-green-500 text-white border-0 text-xs font-medium rounded-full py-2"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDateRequest(profile);
                  }}
                  disabled={loading[profile.id]}
                >
                  <Heart className="h-3 w-3 mr-1 fill-current" />
                  Like
                </Button>
              </div>
            </div>

            {/* Enhanced Profile Information */}
            <div className="space-y-3">
              {/* Name, Age, and Username */}
              <div className="cursor-pointer" onClick={() => navigate(`/profile/${profile.id}`)}>
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-pink-400 hover:text-pink-300 transition-colors truncate">
                    {profile.name}
                    {profile.age && <span className="text-pink-300 font-medium">, {profile.age}</span>}
                  </h3>
                  {profile.username && (
                    <Badge 
                      variant="outline" 
                      className="text-xs bg-muted/50 border-muted-foreground/30 text-muted-foreground ml-2 flex-shrink-0"
                    >
                      @{profile.username}
                    </Badge>
                  )}
                </div>
              </div>

              {/* Location with enhanced styling */}
              {profile.location && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="h-3 w-3 text-secondary flex-shrink-0" />
                  <span className="truncate">{profile.location}</span>
                </div>
              )}

              {/* Enhanced Bio Section */}
              {profile.shortBio && (
                <div>
                  <span className="text-xs font-semibold text-secondary flex items-center gap-1 mb-1">
                    <Zap className="w-3 h-3" />
                    Bio
                  </span>
                  <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                    {profile.shortBio}
                  </p>
                </div>
              )}

              {/* Enhanced Description - Visible on larger screens */}
              {profile.description && (
                <div className="hidden sm:block">
                  <span className="text-xs font-semibold text-accent flex items-center gap-1 mb-1">
                    <Sparkles className="w-3 h-3" />
                    About
                  </span>
                  <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                    {profile.description}
                  </p>
                </div>
              )}

              {/* Enhanced Interests */}
              {profile.interests && profile.interests.length > 0 && (
                <div>
                  <span className="text-xs font-semibold text-secondary flex items-center gap-1 mb-2">
                    <Heart className="w-3 h-3" />
                    Interests
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {profile.interests.slice(0, 3).map((interest, index) => (
                      <Badge 
                        key={index} 
                        variant="secondary" 
                        className="text-xs px-2 py-1 bg-secondary/10 text-secondary border border-secondary/20 hover:bg-secondary/20 transition-colors"
                      >
                        {interest}
                      </Badge>
                    ))}
                    {profile.interests.length > 3 && (
                      <Badge 
                        variant="outline" 
                        className="text-xs px-2 py-1 border-muted-foreground/30 text-muted-foreground hover:border-primary/30 hover:text-primary transition-colors"
                      >
                        +{profile.interests.length - 3}
                      </Badge>
                    )}
                  </div>
                </div>
              )}

              {/* Enhanced Action Buttons */}
              <div className="grid grid-cols-3 gap-2 pt-3 border-t border-border/30">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-9 text-xs font-medium border-secondary/30 hover:border-secondary hover:bg-secondary/10 text-secondary transition-all duration-300 hover:scale-105"
                  onClick={() => navigate(`/profile/${profile.id}`)}
                >
                  <Eye className="h-3 w-3 mr-1" />
                  View
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  className="h-9 text-xs font-medium border-accent/30 hover:border-accent hover:bg-accent/10 text-accent transition-all duration-300 hover:scale-105"
                  onClick={() => handleMessage(profile)}
                  disabled={loading[profile.id]}
                >
                  <MessageCircle className="h-3 w-3 mr-1" />
                  Message
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  className="h-9 text-xs font-medium border-pink-500/30 hover:border-pink-500 hover:bg-pink-500 hover:text-white text-pink-500 transition-all duration-300 hover:scale-105 active:scale-95"
                  onClick={() => handleDateRequest(profile)}
                  disabled={loading[profile.id]}
                >
                  {loading[profile.id] ? (
                    <div className="w-3 h-3 mr-1 border border-current border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Heart className="h-3 w-3 mr-1 fill-current" />
                  )}
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