import { useState, useRef, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Heart, MessageCircle, MapPin, X, ChevronLeft, ChevronRight, Eye } from "lucide-react";
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

interface ProfileCardProps {
  profile: Profile;
  currentUserId: string;
  onLike: () => void;
  onPass: () => void;
}

const ProfileCard = ({ profile, currentUserId, onLike, onPass }: ProfileCardProps) => {
  const [loading, setLoading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragDirection, setDragDirection] = useState<'left' | 'right' | null>(null);
  const [startX, setStartX] = useState(0);
  const [currentX, setCurrentX] = useState(0);
  const [isMouseDown, setIsMouseDown] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Touch Events (Mobile)
  const handleTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true);
    setStartX(e.touches[0].clientX);
    setCurrentX(e.touches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    
    const touchX = e.touches[0].clientX;
    setCurrentX(touchX);
    
    const deltaX = touchX - startX;
    const direction = deltaX > 0 ? 'right' : 'left';
    setDragDirection(direction);

    if (cardRef.current) {
      cardRef.current.style.transform = `translateX(${deltaX}px) rotate(${deltaX * 0.1}deg)`;
      cardRef.current.style.opacity = `${1 - Math.abs(deltaX) / 300}`;
    }
  };

  const handleTouchEnd = () => {
    if (!isDragging) return;
    handleDragEnd();
  };

  // Mouse Events (Desktop)
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsMouseDown(true);
    setIsDragging(true);
    setStartX(e.clientX);
    setCurrentX(e.clientX);
    e.preventDefault(); // Prevent text selection
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !isMouseDown) return;
    
    const mouseX = e.clientX;
    setCurrentX(mouseX);
    
    const deltaX = mouseX - startX;
    const direction = deltaX > 0 ? 'right' : 'left';
    setDragDirection(direction);

    if (cardRef.current) {
      cardRef.current.style.transform = `translateX(${deltaX}px) rotate(${deltaX * 0.1}deg)`;
      cardRef.current.style.opacity = `${1 - Math.abs(deltaX) / 300}`;
    }
  };

  const handleMouseUp = () => {
    if (!isDragging || !isMouseDown) return;
    setIsMouseDown(false);
    handleDragEnd();
  };

  const handleMouseLeave = () => {
    if (isMouseDown) {
      setIsMouseDown(false);
      handleDragEnd();
    }
  };

  // Common drag end logic
  const handleDragEnd = () => {
    const deltaX = currentX - startX;
    const threshold = 100; // Minimum distance for swipe/drag
    
    if (Math.abs(deltaX) > threshold) {
      if (deltaX < 0) {
        // Left drag/swipe - Pass
        handleSwipePass();
      } else {
        // Right drag/swipe - Like
        handleDateRequest();
      }
    } else {
      // Reset card position
      if (cardRef.current) {
        cardRef.current.style.transform = 'translateX(0px) rotate(0deg)';
        cardRef.current.style.opacity = '1';
        cardRef.current.style.transition = 'all 0.2s ease-in-out';
        // Remove transition after animation
        setTimeout(() => {
          if (cardRef.current) {
            cardRef.current.style.transition = '';
          }
        }, 200);
      }
    }
    
    setIsDragging(false);
    setDragDirection(null);
    setStartX(0);
    setCurrentX(0);
  };

  const handleSwipePass = () => {
    if (cardRef.current) {
      cardRef.current.style.transform = 'translateX(-100%) rotate(-30deg)';
      cardRef.current.style.opacity = '0';
      cardRef.current.style.transition = 'all 0.3s ease-in-out';
      setTimeout(() => {
        onPass();
        // Reset card styles for next profile
        if (cardRef.current) {
          cardRef.current.style.transform = 'translateX(0px) rotate(0deg)';
          cardRef.current.style.opacity = '1';
          cardRef.current.style.transition = '';
        }
      }, 300);
    }
  };

  const handleDateRequest = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from("date_requests")
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
          setLoading(false);
          return;
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
      
      // Animate card out to the right
      if (cardRef.current) {
        cardRef.current.style.transform = 'translateX(100%) rotate(30deg)';
        cardRef.current.style.opacity = '0';
        cardRef.current.style.transition = 'all 0.3s ease-in-out';
        setTimeout(() => {
          onLike();
          // Reset card styles for next profile
          if (cardRef.current) {
            cardRef.current.style.transform = 'translateX(0px) rotate(0deg)';
            cardRef.current.style.opacity = '1';
            cardRef.current.style.transition = '';
          }
        }, 300);
      }
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

  const displayImage = profile.avatar_url || profile.photos?.[0] || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.name)}&background=random&color=fff&size=800`;

  return (
    <div className="relative max-w-sm mx-auto">
      {/* Swipe indicators */}
      <div className="absolute top-4 left-4 z-10 opacity-70">
        <div className={`px-3 py-1 rounded-full text-sm font-bold transition-opacity duration-200 ${
          dragDirection === 'left' ? 'opacity-100 bg-red-500 text-white' : 'opacity-0'
        }`}>
          PASS
        </div>
      </div>
      <div className="absolute top-4 right-4 z-10 opacity-70">
        <div className={`px-3 py-1 rounded-full text-sm font-bold transition-opacity duration-200 ${
          dragDirection === 'right' ? 'opacity-100 bg-green-500 text-white' : 'opacity-0'
        }`}>
          LIKE
        </div>
      </div>

      {/* Desktop Arrow Indicators */}
      <div className="hidden sm:block absolute left-2 top-1/2 transform -translate-y-1/2 z-10">
        <button 
          onClick={() => handleSwipePass()}
          className="bg-black/50 backdrop-blur-sm rounded-full p-2 hover:bg-black/70 transition-colors cursor-pointer"
          disabled={loading}
        >
          <ChevronLeft className="w-6 h-6 text-white" />
        </button>
        <div className="text-center mt-1">
          <span className="text-xs text-white/80 bg-black/40 px-2 py-1 rounded-full">
            Pass
          </span>
        </div>
      </div>
      <div className="hidden sm:block absolute right-2 top-1/2 transform -translate-y-1/2 z-10">
        <button 
          onClick={() => handleDateRequest()}
          className="bg-black/50 backdrop-blur-sm rounded-full p-2 hover:bg-black/70 transition-colors cursor-pointer"
          disabled={loading}
        >
          <ChevronRight className="w-6 h-6 text-white" />
        </button>
        <div className="text-center mt-1">
          <span className="text-xs text-white/80 bg-black/40 px-2 py-1 rounded-full">
            Like
          </span>
        </div>
      </div>

      <Card 
        ref={cardRef}
        className="w-full bg-card/90 backdrop-blur-sm border-primary/30 shadow-[var(--shadow-electric)] hover:shadow-[var(--shadow-lightning)] transition-all duration-300 touch-none select-none cursor-grab active:cursor-grabbing"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        style={{ touchAction: 'none' }}
      >
        <CardContent className="p-0">
          <div className="relative">
            <img
              src={displayImage}
              alt={profile.name}
              className="w-full h-80 sm:h-96 object-cover rounded-t-lg"
              onError={(e) => {
                e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.name)}&background=6366f1&color=fff&size=800`;
              }}
            />
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-primary/10 to-transparent p-4">
              <h3 className="text-pink-400 text-xl font-bold">
                {profile.name}
                {profile.age && (
                  <span className="text-pink-300 font-normal ml-2">{profile.age}</span>
                )}
              </h3>
              {profile.username && (
                <p className="text-pink-300 text-sm">@{profile.username}</p>
              )}
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
              <div>
                <span className="text-sm font-semibold text-primary">Bio: </span>
                <span className="text-muted-foreground text-sm">{profile.shortBio}</span>
              </div>
            )}
            
            {profile.description && (
              <div>
                <span className="text-sm font-semibold text-accent">About: </span>
                <span className="text-muted-foreground text-sm line-clamp-3">{profile.description}</span>
              </div>
            )}

            {profile.interests && profile.interests.length > 0 && (
              <div>
                <span className="text-sm font-semibold text-secondary mb-2 block">Interests:</span>
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
              </div>
            )}

          <div className="flex justify-center gap-4 pt-2">

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

            {/* Swipe instruction text */}
            <div className="text-center text-xs text-muted-foreground/70 mt-2">
              <span className="block sm:hidden">Swipe left to pass, right to like</span>
              <span className="hidden sm:block">Drag left to pass, right to like • Or use buttons</span>
            </div>
        </div>
      </CardContent>
    </Card>
    </div>
  );
};

export default ProfileCard;
