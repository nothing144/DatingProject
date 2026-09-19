import { useState, useRef, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Heart, MessageCircle, MapPin, ChevronLeft, ChevronRight, Eye, Zap } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { getHighQualityUrl, getFallbackAvatarUrl } from "@/lib/imageUtils";

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
      cardRef.current.style.transform = `translateX(${deltaX}px) rotate(${deltaX * 0.08}deg)`;
      cardRef.current.style.opacity = `${1 - Math.abs(deltaX) / 400}`;
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
    e.preventDefault();
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !isMouseDown) return;
    
    const mouseX = e.clientX;
    setCurrentX(mouseX);
    
    const deltaX = mouseX - startX;
    const direction = deltaX > 0 ? 'right' : 'left';
    setDragDirection(direction);

    if (cardRef.current) {
      cardRef.current.style.transform = `translateX(${deltaX}px) rotate(${deltaX * 0.08}deg)`;
      cardRef.current.style.opacity = `${1 - Math.abs(deltaX) / 400}`;
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
    const threshold = 120;
    
    if (Math.abs(deltaX) > threshold) {
      if (deltaX < 0) {
        handleSwipePass();
      } else {
        handleDateRequest();
      }
    } else {
      if (cardRef.current) {
        cardRef.current.style.transform = 'translateX(0px) rotate(0deg)';
        cardRef.current.style.opacity = '1';
        cardRef.current.style.transition = 'var(--transition-spring)';
        setTimeout(() => {
          if (cardRef.current) {
            cardRef.current.style.transition = '';
          }
        }, 400);
      }
    }
    
    setIsDragging(false);
    setDragDirection(null);
    setStartX(0);
    setCurrentX(0);
  };

  const handleSwipePass = () => {
    if (cardRef.current) {
      cardRef.current.style.transform = 'translateX(-120%) rotate(-45deg) scale(0.8)';
      cardRef.current.style.opacity = '0';
      cardRef.current.style.transition = 'var(--transition-spring)';
      setTimeout(() => {
        onPass();
        if (cardRef.current) {
          cardRef.current.style.transform = 'translateX(0px) rotate(0deg) scale(1)';
          cardRef.current.style.opacity = '1';
          cardRef.current.style.transition = '';
        }
      }, 400);
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
        if (error.code === '23505') {
          toast({
            title: "Already Sent! 💕",
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
          title: "Date Request Sent! ✨",
          description: `Your request has been sent to ${profile.name}`
        });
        
        await supabase.rpc('create_notification', {
          target_user_id: profile.id,
          notification_type: 'date_request',
          notification_title: 'New Date Request',
          notification_message: `Someone sent you a date request! 💕`
        });
      }
      
      if (cardRef.current) {
        cardRef.current.style.transform = 'translateX(120%) rotate(45deg) scale(0.8)';
        cardRef.current.style.opacity = '0';
        cardRef.current.style.transition = 'var(--transition-spring)';
        setTimeout(() => {
          onLike();
          if (cardRef.current) {
            cardRef.current.style.transform = 'translateX(0px) rotate(0deg) scale(1)';
            cardRef.current.style.opacity = '1';
            cardRef.current.style.transition = '';
          }
        }, 400);
      }
    } catch (error: unknown) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleMessage = async () => {
    setLoading(true);
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

      toast({
        title: "Conversation Ready! 💬",
        description: `Go to Messages tab to chat with ${profile.name}`,
      });
      
      window.dispatchEvent(new CustomEvent('switchToMessages', { 
        detail: { conversationId: conversationId } 
      }));
      
    } catch (error: unknown) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const displayImage = getHighQualityUrl(profile.avatar_url || profile.photos?.[0] || getFallbackAvatarUrl(profile.name || 'User', 800));

  return (
    <div className="relative w-full max-w-sm mx-auto animate-fadeInScale hover:animate-pulse-glow transition-all duration-300">
      {/* Enhanced Swipe Indicators */}
      <div className="absolute top-4 left-4 z-20">
        <div className={`px-3 py-2 rounded-full text-sm font-bold transition-all duration-300 backdrop-blur-md ${
          dragDirection === 'left' 
            ? 'opacity-100 bg-red-500/90 text-white scale-110 shadow-lg' 
            : 'opacity-0 scale-95'
        }`}>
          <div className="flex items-center gap-2">
            <ChevronLeft className="w-4 h-4" />
            PASS
          </div>
        </div>
      </div>
      
      <div className="absolute top-4 right-4 z-20">
        <div className={`px-3 py-2 rounded-full text-sm font-bold transition-all duration-300 backdrop-blur-md ${
          dragDirection === 'right' 
            ? 'opacity-100 bg-green-500/90 text-white scale-110 shadow-lg' 
            : 'opacity-0 scale-95'
        }`}>
          <div className="flex items-center gap-2">
            LIKE
            <ChevronRight className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* Enhanced Desktop Arrow Controls */}
      <div className="hidden sm:block absolute left-3 top-1/2 transform -translate-y-1/2 z-20">
        <div className="flex flex-col items-center gap-2">
          <Button 
            onClick={() => handleSwipePass()}
            className="w-10 h-10 rounded-full bg-red-500/20 backdrop-blur-md border border-red-500/30 hover:bg-red-500 hover:border-red-500 text-red-500 hover:text-white transition-all duration-300 hover:scale-110 hover:shadow-lg group"
            disabled={loading}
          >
            <ChevronLeft className="w-4 h-4 group-hover:scale-110 transition-transform" />
          </Button>
          <span className="text-xs font-medium bg-background/80 backdrop-blur-sm px-2 py-1 rounded-full text-red-500 border border-red-500/20">
            Pass
          </span>
        </div>
      </div>
      
      <div className="hidden sm:block absolute right-3 top-1/2 transform -translate-y-1/2 z-20">
        <div className="flex flex-col items-center gap-2">
          <Button 
            onClick={() => handleDateRequest()}
            className="w-10 h-10 rounded-full bg-green-500/20 backdrop-blur-md border border-green-500/30 hover:bg-green-500 hover:border-green-500 text-green-500 hover:text-white transition-all duration-300 hover:scale-110 hover:shadow-lg group"
            disabled={loading}
          >
            <ChevronRight className="w-4 h-4 group-hover:scale-110 transition-transform" />
          </Button>
          <span className="text-xs font-medium bg-background/80 backdrop-blur-sm px-2 py-1 rounded-full text-green-500 border border-green-500/20">
            Like
          </span>
        </div>
      </div>

      <Card 
        ref={cardRef}
        className="profile-card w-full touch-none select-none cursor-grab active:cursor-grabbing overflow-hidden"
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
            {/* Properly Sized Profile Image */}
            <div className="relative w-full h-[50vh] sm:h-[60vh] md:h-[65vh] lg:h-[70vh] max-h-[600px] cursor-pointer overflow-hidden rounded-t-[var(--radius-xl)]">
              <img
                src={displayImage}
                alt={profile.name}
                className="w-full h-full object-cover transition-all duration-500"
                loading="lazy"
                onClick={() => navigate(`/profile/${profile.id}`)}
                onError={(e) => {
                  e.currentTarget.src = getFallbackAvatarUrl(profile.name || 'User', 800);
                }}
              />
              
              {/* Enhanced Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
              
              {/* View Profile Button */}
              <div className="absolute top-4 right-4 z-10 sm:top-6 sm:right-6">
                <Button
                  variant="outline"
                  size="sm"
                  className="bg-white/10 backdrop-blur-md border-white/20 text-white hover:bg-white/20 hover:border-white/30 transition-all duration-300 hover:scale-105 text-xs sm:text-sm"
                  onClick={() => navigate(`/profile/${profile.id}`)}
                >
                  <Eye className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                  View Profile
                </Button>
              </div>
              
              {/* Enhanced Profile Info Overlay */}
              <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6 bg-gradient-to-t from-black/90 via-black/60 to-transparent">
                <h3 
                  className="text-pink-400 text-xl sm:text-2xl font-bold cursor-pointer hover:text-pink-300 transition-colors mb-1 drop-shadow-lg"
                  onClick={() => navigate(`/profile/${profile.id}`)}
                >
                  {profile.name}
                  {profile.age && (
                    <span className="text-pink-300 font-medium ml-2 sm:ml-3 text-lg sm:text-xl">{profile.age}</span>
                  )}
                </h3>
                
                {profile.username && (
                  <p className="text-pink-300/90 text-sm mb-2 font-medium">@{profile.username}</p>
                )}
                
                {profile.location && (
                  <div className="flex items-center text-white/90 text-sm mb-3">
                    <MapPin className="w-4 h-4 mr-2" />
                    {profile.location}
                  </div>
                )}
                
                {profile.shortBio && (
                  <p className="text-white/80 text-sm leading-relaxed drop-shadow-sm line-clamp-2">
                    {profile.shortBio}
                  </p>
                )}
              </div>
            </div>

            {/* Compact Profile Details Section */}
            <div className="p-4 sm:p-6 space-y-3 sm:space-y-4 bg-gradient-to-b from-card to-card/95">
              {profile.description && (
                <div>
                  <span className="text-sm font-semibold text-accent flex items-center gap-2 mb-2">
                    <Zap className="w-4 h-4" />
                    About
                  </span>
                  <p className="text-muted-foreground text-sm leading-relaxed line-clamp-3">
                    {profile.description}
                  </p>
                </div>
              )}

              {profile.interests && profile.interests.length > 0 && (
                <div>
                  <span className="text-sm font-semibold text-secondary flex items-center gap-2 mb-3">
                    <Heart className="w-4 h-4" />
                    Interests
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {profile.interests.slice(0, 6).map((interest, index) => (
                      <Badge 
                        key={index} 
                        variant="secondary" 
                        className="text-xs px-3 py-1 bg-secondary/10 text-secondary border border-secondary/20 hover:bg-secondary/20 transition-colors"
                      >
                        {interest}
                      </Badge>
                    ))}
                    {profile.interests.length > 6 && (
                      <Badge 
                        variant="outline" 
                        className="text-xs px-3 py-1 border-muted-foreground/30 text-muted-foreground hover:border-primary/30 hover:text-primary transition-colors"
                      >
                        +{profile.interests.length - 6} more
                      </Badge>
                    )}
                  </div>
                </div>
              )}

              {/* Enhanced Action Buttons */}
              <div className="flex justify-center gap-3 sm:gap-4 pt-3 sm:pt-4">
                <Button
                  variant="outline"
                  size="lg"
                  className="flex-1 max-w-[120px] h-11 sm:h-12 rounded-full border-secondary/30 hover:border-secondary hover:bg-secondary/10 text-secondary hover:text-secondary transition-all duration-300 hover:scale-105 hover:shadow-lg group"
                  onClick={handleMessage}
                  disabled={loading}
                >
                  <MessageCircle className="w-4 h-4 sm:w-5 sm:h-5 mr-2 group-hover:scale-110 transition-transform" />
                  Chat
                </Button>

                <Button
                  variant="outline"
                  size="lg"
                  className="flex-1 max-w-[120px] h-11 sm:h-12 rounded-full border-pink-500/30 bg-gradient-to-r from-pink-500/10 to-rose-500/10 text-pink-500 hover:from-pink-500 hover:to-rose-500 hover:text-white hover:border-transparent transition-all duration-300 hover:scale-105 hover:shadow-lg group active:scale-95"
                  onClick={handleDateRequest}
                  disabled={loading}
                >
                  {loading ? (
                    <div className="w-4 h-4 sm:w-5 sm:h-5 mr-2 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Heart className="w-4 h-4 sm:w-5 sm:h-5 mr-2 fill-current group-hover:scale-110 transition-transform" />
                  )}
                  Like
                </Button>
              </div>

              {/* Enhanced Swipe Instructions */}
              <div className="text-center text-xs text-muted-foreground/70 pt-3 border-t border-border/30">
                <span className="block sm:hidden bg-muted/20 px-3 py-2 rounded-full">
                  💫 Swipe left to pass, right to like
                </span>
                <span className="hidden sm:block bg-muted/20 px-4 py-2 rounded-full">
                  ⚡ Drag or use arrows to navigate • Click to view profile
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProfileCard;