import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Heart, MessageCircle, User, Megaphone, LogOut, Zap } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { toast } from "@/hooks/use-toast";

interface NavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const Navigation = ({ activeTab, onTabChange }: NavigationProps) => {
  const [user, setUser] = useState<any>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user || null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    console.log("Logout button clicked - starting logout process");
    
    try {
      // Clear local storage first to ensure clean state
      localStorage.clear();
      sessionStorage.clear();
      
      // Attempt to sign out from Supabase
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.warn("Supabase signOut returned error:", error);
        // Don't throw here - we'll still proceed with local cleanup
      }
      
      console.log("Logout successful - navigating to auth page");
      
      // Always navigate to auth page and show success message
      toast({
        title: "Logged Out Successfully! 👋",
        description: "You have been signed out safely."
      });
      
      // Force page reload to clear any cached auth state
      window.location.href = "/auth";
      
    } catch (error: any) {
      // Even if there's an error, we should still clear local state and redirect
      console.error("Error during logout process:", error);
      
      // Clear storage anyway
      localStorage.clear();
      sessionStorage.clear();
      
      toast({
        title: "Logged Out (with cleanup)",
        description: "Session cleared. If you experience issues, please refresh the page.",
        variant: "destructive"
      });
      
      // Force redirect regardless of error
      window.location.href = "/auth";
    }
  };

  const navItems = [
    { 
      id: "discover", 
      icon: Heart, 
      label: "Discover",
      gradient: "from-pink-500 to-rose-500"
    },
    {
      id: "date-requests",
      icon: Zap,
      label: "Dates",
      gradient: "from-amber-500 to-orange-500",
      special: true
    },
    { 
      id: "messages", 
      icon: MessageCircle, 
      label: "Messages",
      gradient: "from-blue-500 to-cyan-500"
    },
    { 
      id: "announcements", 
      icon: Megaphone, 
      label: "Campus",
      gradient: "from-green-500 to-emerald-500"
    },
    { 
      id: "profile", 
      icon: User, 
      label: "Profile",
      gradient: "from-purple-500 to-indigo-500"
    },
  ];

  return (
    <>
      {/* Logout button fixed at top-right corner on mobile */}
      {user && (
        <div className="fixed top-4 right-4 z-50 sm:hidden">
          <Button
            size="icon"
            variant="outline"
            className="rounded-full bg-card/80 backdrop-blur-md border-primary/30 hover:border-primary/50 hover:bg-card/90 focus-enhanced shadow-lg"
            onClick={handleLogout}
          >
            <LogOut className="w-4 h-4 text-primary" />
          </Button>
        </div>
      )}

      {/* Enhanced Edit Profile Button - Always visible for authenticated users */}
      {user && (
        <div className="fixed top-4 left-4 z-50">
          <Button
            size="sm"
            variant="outline"
            className="rounded-full bg-card/80 backdrop-blur-md border-secondary/30 hover:border-secondary hover:bg-secondary/10 focus-enhanced shadow-lg text-secondary transition-all duration-300 hover:scale-105"
            onClick={() => window.location.href = '/profile'}
          >
            <User className="w-4 h-4 mr-2" />
            <span className="hidden sm:inline">Edit Profile</span>
            <span className="sm:hidden">Profile</span>
          </Button>
        </div>
      )}

      {/* Enhanced Bottom Navigation Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-40">
        {/* Glass morphism background */}
        <div className="absolute inset-0 bg-gradient-to-t from-background/95 via-background/90 to-transparent backdrop-blur-xl"></div>
        
        {/* Ambient lighting effect */}
        <div className="absolute inset-0 bg-gradient-to-t from-primary/5 via-transparent to-transparent"></div>
        
        {/* Border gradient */}
        <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-primary/50 to-transparent"></div>
        
        {/* Navigation content */}
        <div className="relative p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
          <div className="flex justify-around items-center max-w-md mx-auto">
            {navItems.map(({ id, icon: Icon, label, gradient, special }) => {
              const isActive = activeTab === id;
              
              return (
                <Button
                  key={id}
                  variant="ghost"
                  size="sm"
                  className={`nav-item relative flex flex-col gap-1 h-auto py-3 px-3 transition-all duration-300 ${
                    isActive
                      ? "text-white shadow-lg"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                  onClick={() => onTabChange(id)}
                >
                  {/* Active background with gradient */}
                  {isActive && (
                    <div className={`absolute inset-0 rounded-lg bg-gradient-to-r ${gradient} opacity-90 animate-fadeInScale`}></div>
                  )}
                  
                  {/* Icon with special effects for date requests */}
                  <div className="relative z-10">
                    {special ? (
                      <div className="relative">
                        <Icon className="w-5 h-5" />
                        {isActive && (
                          <>
                            <div className="absolute inset-0 animate-pulse-glow rounded-full"></div>
                            <div className="absolute -top-1 -right-1 w-2 h-2 bg-yellow-300 rounded-full animate-pulse shadow-lg"></div>
                          </>
                        )}
                      </div>
                    ) : (
                      <Icon className={`w-5 h-5 ${isActive ? 'drop-shadow-sm' : ''}`} />
                    )}
                  </div>
                  
                  {/* Label with enhanced typography */}
                  <span className={`text-xs font-medium relative z-10 ${
                    isActive ? 'drop-shadow-sm' : ''
                  }`}>
                    {label}
                  </span>
                  
                  {/* Hover effect indicator */}
                  {!isActive && (
                    <div className={`absolute inset-0 rounded-lg bg-gradient-to-r ${gradient} opacity-0 hover:opacity-20 transition-opacity duration-300`}></div>
                  )}
                </Button>
              );
            })}
            
            {/* Desktop Logout Button */}
            {user && (
              <Button
                variant="ghost"
                size="sm"
                className="hidden sm:flex nav-item flex-col gap-1 h-auto py-3 px-3 text-muted-foreground hover:text-destructive transition-all duration-300"
                onClick={handleLogout}
              >
                <LogOut className="w-5 h-5" />
                <span className="text-xs font-medium">Logout</span>
              </Button>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default Navigation;
