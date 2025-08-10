import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Heart, MessageCircle, MapPin, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

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

  const handleMessage = async (profile: Profile) => {
    if (loading[profile.id]) return;
    
    setLoading(prev => ({ ...prev, [profile.id]: true }));
    
    try {
      const { data: existingConversation, error: fetchError } = await supabase
        .rpc('get_or_create_conversation', {
          user1_id: currentUserId,
          user2_id: profile.id
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

      if (error) throw error;

      toast({
        title: "Date request sent!",
        description: `Your date request has been sent to ${profile.name}!`
      });

      onLike(profile.id);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to send date request",
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
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 p-4">
      {profiles.map((profile) => (
        <Card key={profile.id} className="relative overflow-hidden bg-card/50 backdrop-blur-sm border-primary/20 hover:border-primary/40 transition-all duration-300 hover:shadow-[0_0_20px_hsl(var(--primary)/0.3)] group">
          <CardContent className="p-4">
            {/* Profile Image */}
            <div className="relative w-full h-48 mb-4 rounded-lg overflow-hidden bg-gradient-to-br from-primary/20 via-secondary/20 to-accent/20">
              {profile.avatar_url || (profile.photos && profile.photos[0]) ? (
                <img
                  src={profile.avatar_url || profile.photos?.[0]}
                  alt={profile.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <User className="h-16 w-16 text-muted-foreground" />
                </div>
              )}
              
              {/* Quick action overlay */}
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                  onClick={() => onPass(profile.id)}
                >
                  Pass
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="bg-pink-500/80 border-pink-500/50 text-white hover:bg-pink-500"
                  onClick={() => handleDateRequest(profile)}
                  disabled={loading[profile.id]}
                >
                  <Heart className="h-4 w-4 mr-1" />
                  Like
                </Button>
              </div>
            </div>

            {/* Profile Info */}
            <div className="space-y-3">
              {/* Name and Age */}
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-pink-400 truncate">
                  {profile.name}
                  {profile.age && <span className="text-pink-300">, {profile.age}</span>}
                </h3>
                {profile.username && (
                  <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                    @{profile.username}
                  </span>
                )}
              </div>

              {/* Location */}
              {profile.location && (
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <MapPin className="h-3 w-3" />
                  <span className="truncate">{profile.location}</span>
                </div>
              )}

              {/* Bio */}
              {profile.shortBio && (
                <div>
                  <span className="text-sm font-semibold text-secondary">Bio: </span>
                  <span className="text-sm text-muted-foreground line-clamp-2">{profile.shortBio}</span>
                </div>
              )}

              {/* Description */}
              {profile.description && (
                <div>
                  <span className="text-sm font-semibold text-accent">About: </span>
                  <span className="text-sm text-muted-foreground line-clamp-2">{profile.description}</span>
                </div>
              )}

              {/* Interests */}
              {profile.interests && profile.interests.length > 0 && (
                <div>
                  <span className="text-sm font-semibold text-secondary mb-2 block">Interests:</span>
                  <div className="flex flex-wrap gap-1">
                    {profile.interests.slice(0, 3).map((interest, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {interest}
                      </Badge>
                    ))}
                    {profile.interests.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{profile.interests.length - 3}
                      </Badge>
                    )}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex justify-center gap-3 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 border-secondary/50 hover:bg-secondary hover:text-secondary-foreground"
                  onClick={() => handleMessage(profile)}
                  disabled={loading[profile.id]}
                >
                  <MessageCircle className="h-4 w-4 mr-1" />
                  Message
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 border-primary/50 text-pink-500 hover:bg-pink-500 hover:text-white"
                  onClick={() => handleDateRequest(profile)}
                  disabled={loading[profile.id]}
                >
                  <Heart className="h-4 w-4 mr-1" />
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