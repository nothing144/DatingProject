import { useState } from "react";
import ProfileCard from "@/components/ProfileCard";
import ProfileGrid from "@/components/ProfileGrid";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

// Mock profiles for UI demonstration
const mockProfiles = [
  {
    id: "1",
    name: "Aisha Sharma",
    username: "aisha_s",
    age: 20,
    location: "Bhubaneswar, Odisha",
    description: "Computer Science student who loves coding and music. Looking for someone to share adventures with!",
    shortBio: "Coding enthusiast, music lover, and adventure seeker 🎵💻✨",
    interests: ["Programming", "Music", "Photography", "Dancing", "Reading", "Travel"],
    avatar_url: "https://images.unsplash.com/photo-1494790108755-2616b62b8e3d?w=400&h=400&fit=crop&crop=face",
    photos: ["https://images.unsplash.com/photo-1494790108755-2616b62b8e3d?w=400&h=600&fit=crop&crop=face"]
  },
  {
    id: "2", 
    name: "Rohan Kumar",
    username: "rohan_k",
    age: 21,
    location: "Bhubaneswar, Odisha",
    description: "Engineering student passionate about technology and sports. Love playing cricket and exploring new places!",
    shortBio: "Tech geek by day, cricket player by evening 🏏⚡",
    interests: ["Cricket", "Technology", "Gaming", "Movies"],
    avatar_url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=face",
    photos: ["https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=600&fit=crop&crop=face"]
  },
  {
    id: "3",
    name: "Priya Patel",
    username: "priya_p",
    age: 19,
    location: "Bhubaneswar, Odisha", 
    description: "Art student who loves painting and creative expression. Always looking for inspiration in everyday moments.",
    shortBio: "Artist painting her way through college life 🎨🌈",
    interests: ["Art", "Painting", "Literature", "Yoga", "Nature"],
    avatar_url: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop&crop=face",
    photos: ["https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=600&fit=crop&crop=face"]
  },
  {
    id: "4",
    name: "Vikram Singh",
    username: "vikram_s",
    age: 22,
    location: "Bhubaneswar, Odisha",
    description: "Final year mechanical engineering student. Love working with machines and building cool stuff!",
    shortBio: "Building the future, one gear at a time ⚙️🔧",
    interests: ["Engineering", "Robotics", "Basketball", "Cooking"],
    avatar_url: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop&crop=face",
    photos: ["https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=600&fit=crop&crop=face"]
  },
  {
    id: "5",
    name: "Ananya Das",
    username: "ananya_d", 
    age: 20,
    location: "Bhubaneswar, Odisha",
    description: "Economics major with a passion for social work and community development. Love discussing current affairs!",
    shortBio: "Changing the world one conversation at a time 🌍💪",
    interests: ["Economics", "Social Work", "Debate", "Volunteering", "Books"],
    avatar_url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=400&fit=crop&crop=face",
    photos: ["https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=600&fit=crop&crop=face"]
  },
  {
    id: "6",
    name: "Arjun Mishra",
    username: "arjun_m",
    age: 21,
    location: "Bhubaneswar, Odisha",
    description: "Medical student with a passion for helping others. Love photography and capturing beautiful moments.",
    shortBio: "Healing hearts, capturing moments 💊📸",
    interests: ["Medicine", "Photography", "Hiking", "Chess"],
    avatar_url: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop&crop=face",
    photos: ["https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=600&fit=crop&crop=face"]
  }
];

const UIDemo = () => {
  const [viewMode, setViewMode] = useState<"single" | "grid">("grid");
  const [currentIndex, setCurrentIndex] = useState(0);
  const currentUserId = "demo-user";

  const handleLike = () => {
    console.log("Like clicked");
    setCurrentIndex((prev) => (prev + 1) % mockProfiles.length);
  };

  const handlePass = () => {
    console.log("Pass clicked");  
    setCurrentIndex((prev) => (prev + 1) % mockProfiles.length);
  };

  const handleGridLike = (profileId: string) => {
    console.log("Grid like:", profileId);
  };

  const handleGridPass = (profileId: string) => {
    console.log("Grid pass:", profileId);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/20 via-background to-secondary/20 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary via-accent to-secondary bg-clip-text text-transparent mb-2">
            ⚡ Heartbeat@ITER UI Demo ⚡
          </h1>
          <p className="text-muted-foreground">
            Profile Display UI - Desktop & Mobile Testing
          </p>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-semibold">Discover Profiles</h2>
          <div className="flex items-center gap-4">
            {/* View Mode Toggle */}
            <div className="flex rounded-lg border border-border p-1">
              <Button
                variant={viewMode === "grid" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("grid")}
                className="h-8 px-3"
              >
                Grid View
              </Button>
              <Button
                variant={viewMode === "single" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("single")}
                className="h-8 px-3"
              >
                Single View
              </Button>
            </div>
            
            <Badge variant="secondary" className="text-sm">
              {mockProfiles.length} profiles
            </Badge>
          </div>
        </div>

        {/* Profile Display */}
        {viewMode === "grid" ? (
          <ProfileGrid
            profiles={mockProfiles}
            currentUserId={currentUserId}
            onLike={handleGridLike}
            onPass={handleGridPass}
          />
        ) : (
          <div className="flex justify-center">
            <ProfileCard
              key={`${mockProfiles[currentIndex].id}-${currentIndex}`}
              profile={mockProfiles[currentIndex]}
              currentUserId={currentUserId}
              onLike={handleLike}
              onPass={handlePass}
            />
          </div>
        )}

        {/* Single view navigation */}
        {viewMode === "single" && (
          <div className="flex justify-center gap-4 mt-6">
            <Button
              variant="outline"
              onClick={() => setCurrentIndex((prev) => (prev - 1 + mockProfiles.length) % mockProfiles.length)}
            >
              Previous
            </Button>
            <Badge variant="outline">
              {currentIndex + 1} of {mockProfiles.length}
            </Badge>
            <Button
              variant="outline"
              onClick={() => setCurrentIndex((prev) => (prev + 1) % mockProfiles.length)}
            >
              Next
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default UIDemo;