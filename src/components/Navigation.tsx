import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Heart, MessageCircle, User, Megaphone, LogOut, Calendar } from "lucide-react";
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
    { id: "date-requests", icon: Calendar, label: "Dates" },
    { id: "messages", icon: MessageCircle, label: "Messages" },
    { id: "announcements", icon: Megaphone, label: "Campus" },
    { id: "profile", icon: User, label: "Profile" },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-sm border-t border-primary/20 p-2 safe-area-pb">
      <div className="flex justify-around items-center max-w-md mx-auto">
        {navItems.map(({ id, icon: Icon, label }) => (
          <Button
            key={id}
            variant={activeTab === id ? "default" : "ghost"}
            size="sm"
            className={`flex flex-col gap-1 h-auto py-2 px-3 ${
              activeTab === id 
                ? "bg-primary text-primary-foreground" 
                : "text-muted-foreground hover:text-foreground"
            }`}
            onClick={() => onTabChange(id)}
          >
            <Icon className="w-5 h-5" />
            <span className="text-xs">{label}</span>
          </Button>
        ))}
        
        {user && (
          <Button
            variant="ghost"
            size="sm"
            className="flex flex-col gap-1 h-auto py-2 px-3 text-muted-foreground hover:text-foreground"
            onClick={handleLogout}
          >
            <LogOut className="w-5 h-5" />
            <span className="text-xs">Logout</span>
          </Button>
        )}
      </div>
    </div>
  );
};

export default Navigation;