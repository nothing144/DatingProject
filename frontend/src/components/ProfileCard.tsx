import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Heart, X, MessageCircle, MapPin } from "lucide-react";
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

interface ProfileCardProps {
  profile: Profile;
  currentUserId: string;
  onLike: () => void;
  onPass: () => void;
}

const ProfileCard = ({ profile, currentUserId, onLike, onPass }: ProfileCardProps) => {
  const [loading, setLoading] = useState(false);

  const handleDateRequest = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from("date_requests")
        .insert({
          sender_id: currentUserId,
          receiver_id: profile.id
        });

      if (error) {
        if (error.code === '23505') { // Unique constraint violation
          toast({
            title: "Already Sent",
            description: "You've already sent a date request to this person",
            variant: "destructive"
          });
        } else {
          throw error;
        }
      } else {
        toast({
          title: "Date Request Sent! 💕",
          description: `Your date request has been sent to ${profile.name}`
        });
        
        // Create notification for the receiver
        await supabase.rpc('create_notification', {
          target_user_id: profile.id,
          notification_type: 'date_request',
          notification_title: 'New Date Request',
          notification_message: `Someone sent you a date request!`
        });
      }
      
      onLike();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleMessage = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('get_or_create_conversation', {
        user1: currentUserId,
        user2: profile.id
      });

      if (error) throw error;

      toast({
        title: "Conversation Ready! 💬",
        description: `Go to Messages tab to chat with ${profile.name}`,
      });
      
      // Trigger a custom event to switch to messages tab
      window.dispatchEvent(new CustomEvent('switchToMessages', { 
        detail: { conversationId: data } 
      }));
      
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const displayImage = profile.avatar_url || profile.photos?.[0] || "/placeholder.svg";

  return (
    <Card className="w-full max-w-sm mx-auto bg-card/90 backdrop-blur-sm border-primary/30 shadow-[var(--shadow-electric)] hover:shadow-[var(--shadow-lightning)] transition-all duration-300 hover:scale-105">
      <CardContent className="p-0">
        <div className="relative">
          <img
            src={displayImage}
            alt={profile.name}
            className="w-full h-96 object-cover rounded-t-lg"
            onError={(e) => {
              e.currentTarget.src = "/placeholder.svg";
            }}
          />
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-primary/10 to-transparent p-4">
            <h3 className="text-white text-xl font-bold">
              {profile.name}
              {profile.age && (
                <span className="text-white/80 font-normal ml-2">{profile.age}</span>
              )}
            </h3>
            {profile.location && (
              <div className="flex items-center text-white/80 text-sm mt-1">
                <MapPin className="w-3 h-3 mr-1" />
                {profile.location}
              </div>
            )}
          </div>
        </div>

        <div className="p-4 space-y-3">
          {profile.shortBio && (
            <p className="text-muted-foreground text-sm">{profile.shortBio}</p>
          )}
          
          {profile.description && (
            <p className="text-sm">{profile.description}</p>
          )}

          {profile.interests && profile.interests.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {profile.interests.slice(0, 4).map((interest, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {interest}
                </Badge>
              ))}
              {profile.interests.length > 4 && (
                <Badge variant="outline" className="text-xs">
                  +{profile.interests.length - 4} more
                </Badge>
              )}
            </div>
          )}

          <div className="flex justify-center gap-4 pt-2">
            <Button
              variant="outline"
              size="icon"
              className="rounded-full w-12 h-12 border-destructive/50 hover:bg-destructive hover:text-destructive-foreground hover:shadow-[var(--shadow-neon)] transition-all duration-300"
              onClick={onPass}
              disabled={loading}
            >
              <X className="w-5 h-5" />
            </Button>
            
            <Button
              variant="outline"
              size="icon"
              className="rounded-full w-12 h-12 border-secondary/50 hover:bg-secondary hover:text-secondary-foreground hover:shadow-[0_0_20px_hsl(var(--secondary))] transition-all duration-300"
              onClick={handleMessage}
              disabled={loading}
            >
              <MessageCircle className="w-5 h-5" />
            </Button>

            <Button
  variant="outline"
  size="icon"
  className="rounded-full w-12 h-12 border-primary/50 text-pink-500 hover:bg-pink-500 hover:text-white hover:shadow-[0_0_20px_hsl(var(--primary))] transition-all duration-300 active:scale-95"
  onClick={handleDateRequest}
  disabled={loading}
>
  <Heart className="w-5 h-5 fill-current" />
</Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProfileCard;
