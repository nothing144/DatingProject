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
      let conversationId;
      
      // Fallback 1: Check if exists
      const { data: existing, error: queryError } = await supabase
        .from('conversations')
        .select('id')
        .or(`and(participant_1.eq.${currentUserId},participant_2.eq.${profile.id}),and(participant_1.eq.${profile.id},participant_2.eq.${currentUserId})`)
        .maybeSingle();
        
      if (existing) {
        conversationId = existing.id;
      } else {
        // Fallback 2: Create
        const { data: newConvo, error: insertError } = await supabase
          .from('conversations')
          .insert({ participant_1: currentUserId, participant_2: profile.id })
          .select()
          .single();
          
        if (insertError) throw insertError;
        conversationId = newConvo.id;
      }

      window.dispatchEvent(new CustomEvent('switchToMessages', {
        detail: { conversationId: conversationId }
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
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 animate-fadeInUp">
      {profiles.map((profile, index) => (
        <Card 
          key={profile.id} 
          className="card-enhanced group cursor-pointer transform transition-all duration-500 max-w-sm mx-auto w-full"
          style={{ 
            animationDelay: `${index * 0.1}s`,
            animation: `fadeInUp 0.6s ease-out ${index * 0.1}s both`
          }}
          onMouseEnter={() => setHoveredCard(profile.id)}
          onMouseLeave={() => setHoveredCard(null)}
        >
          <CardContent className="p-3 sm:p-4">
            {/* Optimized Profile Image Section */}
            <div 
              className="relative w-full h-48 sm:h-56 lg:h-52 xl:h-48 mb-3 cursor-pointer overflow-hidden rounded-lg"
              onClick={() => navigate(`/profile/${profile.id}`)}
            >
              
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
                  <User className="h-8 w-8 sm:h-12 sm:w-12 mb-2 opacity-80" />
                  <span className="text-sm font-medium opacity-90 text-center px-2">{profile.name}</span>
                </div>
              )}
              
              {/* Enhanced View Profile Overlay */}
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                <div className="bg-white/20 backdrop-blur-md rounded-full p-3 transform scale-0 group-hover:scale-100 transition-transform duration-300">
                  <Eye className="h-5 w-5 text-white" />
                </div>
              </div>
              
              {/* Compact Action Buttons Overlay */}
              <div className="absolute inset-x-2 bottom-2 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-4 group-hover:translate-y-0">
                <Button
                  size="sm"
                  className="flex-1 bg-red-500/90 backdrop-blur-md hover:bg-red-500 text-white border-0 text-xs font-medium rounded-lg py-1.5 px-2"
                  onClick={(e) => {
                    e.stopPropagation();
                    onPass(profile.id);
                  }}
                >
                  Pass
                </Button>
                <Button
                  size="sm"
                  className="flex-1 bg-green-500/90 backdrop-blur-md hover:bg-green-500 text-white border-0 text-xs font-medium rounded-lg py-1.5 px-2"
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

            {/* Compact Profile Information */}
            <div className="space-y-2.5">
              {/* Name, Age, and Username */}
              <div className="cursor-pointer" onClick={() => navigate(`/profile/${profile.id}`)}>
                <div className="flex items-start justify-between">
                  <h3 className="text-base font-bold text-pink-400 hover:text-pink-300 transition-colors line-clamp-1">
                    {profile.name}
                    {profile.age && <span className="text-pink-300 font-medium">, {profile.age}</span>}
                  </h3>
                  {profile.username && (
                    <Badge 
                      variant="outline" 
                      className="text-xs bg-muted/50 border-muted-foreground/30 text-muted-foreground ml-2 flex-shrink-0 h-5"
                    >
                      @{profile.username}
                    </Badge>
                  )}
                </div>
              </div>

              {/* Location with enhanced styling */}
              {profile.location && (
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <MapPin className="h-3 w-3 text-secondary flex-shrink-0" />
                  <span className="truncate">{profile.location}</span>
                </div>
              )}

              {/* Compact Bio Section */}
              {profile.shortBio && (
                <div>
                  <span className="text-xs font-semibold text-secondary flex items-center gap-1 mb-1">
                    <Zap className="w-3 h-3" />
                    Bio
                  </span>
                  <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                    {profile.shortBio}
                  </p>
                </div>
              )}

              {/* Compact Interests */}
              {profile.interests && profile.interests.length > 0 && (
                <div>
                  <span className="text-xs font-semibold text-secondary flex items-center gap-1 mb-1.5">
                    <Heart className="w-3 h-3" />
                    Interests
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {profile.interests.slice(0, 2).map((interest, index) => (
                      <Badge 
                        key={index} 
                        variant="secondary" 
                        className="text-xs px-2 py-0.5 bg-secondary/10 text-secondary border border-secondary/20 hover:bg-secondary/20 transition-colors"
                      >
                        {interest}
                      </Badge>
                    ))}
                    {profile.interests.length > 2 && (
                      <Badge 
                        variant="outline" 
                        className="text-xs px-2 py-0.5 border-muted-foreground/30 text-muted-foreground hover:border-primary/30 hover:text-primary transition-colors"
                      >
                        +{profile.interests.length - 2}
                      </Badge>
                    )}
                  </div>
                </div>
              )}

              {/* Compact Action Buttons */}
              <div className="grid grid-cols-3 gap-1.5 pt-2 border-t border-border/30">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs font-medium border-secondary/30 hover:border-secondary hover:bg-secondary/10 text-secondary transition-all duration-300 hover:scale-105 px-2"
                  onClick={() => navigate(`/profile/${profile.id}`)}
                >
                  <Eye className="h-3 w-3 mr-1" />
                  View
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs font-medium border-accent/30 hover:border-accent hover:bg-accent/10 text-accent transition-all duration-300 hover:scale-105 px-2"
                  onClick={() => handleMessage(profile)}
                  disabled={loading[profile.id]}
                >
                  <MessageCircle className="h-3 w-3 mr-1" />
                  Chat
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs font-medium border-pink-500/30 hover:border-pink-500 hover:bg-pink-500 hover:text-white text-pink-500 transition-all duration-300 hover:scale-105 active:scale-95 px-2"
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