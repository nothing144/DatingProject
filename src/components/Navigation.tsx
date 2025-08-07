import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Heart, MessageCircle, User, Megaphone, LogOut } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

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
    await supabase.auth.signOut();
    navigate("/auth");
  };

  const navItems = [
    { id: "discover", icon: Heart, label: "Discover" },
    {
      id: "date-requests",
      icon: (props: any) => (
        <Heart
          {...props}
          className="w-5 h-5 text-pink-500 animate-pulse drop-shadow-[0_0_8px_#ec4899]"
        />
      ),
      label: "Dates",
    },
    { id: "messages", icon: MessageCircle, label: "Messages" },
    { id: "announcements", icon: Megaphone, label: "Campus" },
    { id: "profile", icon: User, label: "Profile" },
  ];

  return (
    <>
      {/* Logout button fixed at top-right corner on mobile */}
      {user && (
        <div className="fixed top-2 right-4 z-50 sm:hidden">
          <Button
            size="icon"
            variant="outline"
            className="rounded-full"
            onClick={handleLogout}
          >
            <LogOut className="w-5 h-5" />
          </Button>
        </div>
      )}

      {/* Bottom Navigation Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-sm border-t border-primary/20 p-2 safe-area-pb z-40">
        <div className="flex justify-around items-center max-w-md mx-auto">
          {navItems.map(({ id, icon: Icon, label }) => (
            <Button
              key={id}
              variant={activeTab === id ? "default" : "ghost"}
              size="sm"
              className={flex flex-col gap-1 h-auto py-2 px-3 ${
                activeTab === id
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }}
              onClick={() => onTabChange(id)}
            >
              <Icon className="w-5 h-5" />
              <span className="text-xs">{label}</span>
            </Button>
          ))}
        </div>
      </div>
    </>
  );
};

export default Navigation;
