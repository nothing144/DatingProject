// src/pages/ViewProfilePage.tsx

import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Camera, MapPin, Heart, User, GraduationCap, Sparkles, ArrowLeft, Calendar, BookOpen } from "lucide-react";

const ViewProfilePage = () => {
  const { id } = useParams<{ id: string }>();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (!id) return;

    supabase
      .from("profiles")
      .select("*")
      .eq("id", id)
      .single()
      .then(({ data, error }) => {
        if (error) console.error(error);
        else setProfile(data);
        setLoading(false);
      });
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center profile-bg relative overflow-hidden">
        {/* Background Effects for Loading */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="floating-orb"></div>
          <div className="floating-orb"></div>
          <div className="floating-orb"></div>
        </div>
        
        <div className="text-center relative z-10">
          <div className="relative mb-8">
            <div className="absolute inset-0 bg-gradient-to-r from-primary via-accent to-secondary rounded-full blur-xl opacity-50 animate-pulse"></div>
            <div className="relative w-20 h-20 mx-auto bg-gradient-to-r from-primary via-accent to-secondary rounded-full flex items-center justify-center">
              <div className="w-10 h-10 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
            </div>
          </div>
          <div className="bg-black/20 backdrop-blur-sm px-6 py-3 rounded-full border border-white/10">
            <p className="text-white/90 font-medium">Loading profile...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen profile-bg relative overflow-hidden flex items-center justify-center">
        {/* Background Effects */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="floating-orb"></div>
          <div className="floating-orb"></div>
        </div>
        
        <div className="text-center relative z-10">
          <div className="bg-black/20 backdrop-blur-sm px-8 py-6 rounded-2xl border border-white/10">
            <User className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-xl font-bold text-white mb-2">Profile Not Found</h2>
            <p className="text-white/70 mb-4">This profile doesn't exist or has been deleted.</p>
            <Button 
              onClick={() => navigate("/")}
              className="btn-primary-enhanced"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Discover
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const displayImage = profile.avatar_url || "/placeholder.svg";
  const currentYear = new Date().getFullYear();
  const academicYearNames = {
    1: "1st Year",
    2: "2nd Year", 
    3: "3rd Year",
    4: "4th Year"
  };

  return (
    <div className="min-h-screen profile-bg relative overflow-hidden">
      {/* Enhanced Background Effects */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Floating Orbs */}
        <div className="floating-orb"></div>
        <div className="floating-orb"></div>
        <div className="floating-orb"></div>
        
        {/* Particle Effects */}
        {[...Array(12)].map((_, i) => (
          <div
            key={i}
            className="particle"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${i * 0.5}s`,
            }}
          />
        ))}
      </div>

      {/* Content */}
      <div className="relative z-10 p-4 pb-24">
        {/* Back Button */}
        <div className="container mx-auto max-w-md mb-4">
          <Button 
            variant="outline"
            size="sm"
            onClick={() => navigate("/")}
            className="bg-black/20 backdrop-blur-sm border-white/20 text-white hover:bg-black/30 hover:border-white/30"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        </div>

        <div className="container mx-auto max-w-md">
          {/* Main Profile Card */}
          <Card className="card-enhanced animate-fadeInScale overflow-hidden">
            {/* Hero Section with Profile Image */}
            <div className="relative h-64 bg-gradient-to-br from-primary via-accent to-secondary">
              {/* Profile Image */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="relative">
                  <div className="w-40 h-40 rounded-full bg-white/10 backdrop-blur-sm p-2">
                    <div className="w-full h-full rounded-full overflow-hidden bg-card shadow-2xl">
                      <img
                        src={displayImage}
                        alt={profile.name}
                        className="w-full h-full object-cover transition-transform hover:scale-105"
                        onError={(e) => (e.currentTarget.src = "/placeholder.svg")}
                      />
                    </div>
                  </div>
                  
                  {/* Status Indicator */}
                  <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-gradient-to-r from-green-400 to-green-500 rounded-full flex items-center justify-center shadow-lg">
                    <div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>
                  </div>
                </div>
              </div>
              
              {/* Decorative Elements */}
              <div className="absolute top-4 left-4">
                <div className="w-8 h-8 bg-white/20 rounded-full animate-pulse"></div>
              </div>
              <div className="absolute top-8 right-6">
                <div className="w-4 h-4 bg-white/30 rounded-full animate-pulse delay-300"></div>
              </div>
              <div className="absolute bottom-8 left-8">
                <div className="w-6 h-6 bg-white/15 rounded-full animate-pulse delay-500"></div>
              </div>
            </div>

            <CardContent className="p-6 space-y-6">
              {/* Name and Basic Info */}
              <div className="text-center space-y-3">
                <h1 className="text-3xl font-bold bg-gradient-to-r from-primary via-accent to-secondary bg-clip-text text-transparent">
                  {profile.name}
                </h1>
                
                {profile.username && (
                  <div className="flex items-center justify-center gap-2">
                    <Sparkles className="w-4 h-4 text-accent" />
                    <span className="text-accent font-medium">@{profile.username}</span>
                  </div>
                )}

                {profile.age && (
                  <div className="flex items-center justify-center gap-2 text-muted-foreground">
                    <Calendar className="w-4 h-4" />
                    <span>{profile.age} years old</span>
                  </div>
                )}

                {profile.location && (
                  <div className="flex items-center justify-center gap-2 text-muted-foreground">
                    <MapPin className="w-4 h-4 text-secondary" />
                    <span>{profile.location}</span>
                  </div>
                )}
              </div>

              {/* Academic Info */}
              {(profile.branch || profile.year) && (
                <div className="bg-gradient-to-r from-accent/10 to-secondary/10 rounded-2xl p-4 border border-accent/20">
                  <div className="flex items-center gap-2 mb-3">
                    <GraduationCap className="w-5 h-5 text-accent" />
                    <h3 className="font-semibold text-accent">Academic Profile</h3>
                  </div>
                  
                  <div className="space-y-2">
                    {profile.branch && (
                      <div className="flex items-center gap-2">
                        <BookOpen className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm font-medium">{profile.branch}</span>
                      </div>
                    )}
                    
                    {profile.year && (
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm font-medium">{academicYearNames[profile.year as keyof typeof academicYearNames] || `${profile.year} Year`}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Short Bio */}
              {profile.shortBio && (
                <div className="bg-gradient-to-r from-primary/10 to-secondary/10 rounded-2xl p-4 border border-primary/20">
                  <div className="flex items-center gap-2 mb-2">
                    <Heart className="w-4 h-4 text-primary" />
                    <h3 className="font-semibold text-primary">Quick Intro</h3>
                  </div>
                  <p className="text-sm leading-relaxed italic">{profile.shortBio}</p>
                </div>
              )}

              {/* About Section */}
              {profile.description && (
                <div className="bg-muted/30 rounded-2xl p-4 border border-muted">
                  <div className="flex items-center gap-2 mb-3">
                    <User className="w-4 h-4 text-foreground" />
                    <h3 className="font-semibold">About Me</h3>
                  </div>
                  <p className="text-sm leading-relaxed">{profile.description}</p>
                </div>
              )}

              {/* Interests */}
              {profile.interests && profile.interests.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-secondary" />
                    <h3 className="font-semibold text-secondary">Interests & Hobbies</h3>
                  </div>
                  
                  <div className="flex flex-wrap gap-2">
                    {profile.interests.map((interest: string, i: number) => (
                      <Badge
                        key={i}
                        variant="secondary"
                        className="bg-secondary/20 text-secondary border border-secondary/30 hover:bg-secondary/30 px-3 py-2 text-sm font-medium transition-all duration-300 hover:scale-105"
                      >
                        {interest}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Section */}
              <div className="pt-4 border-t border-border/50">
                <div className="flex items-center justify-center gap-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Heart className="w-4 h-4 text-pink-400" />
                    <span>Looking for connections</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Fun Stats Card */}
          <Card className="card-enhanced mt-4 animate-fadeInScale delay-100">
            <CardContent className="p-4">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="space-y-1">
                  <div className="text-2xl font-bold text-primary">
                    {profile.interests?.length || 0}
                  </div>
                  <div className="text-xs text-muted-foreground">Interests</div>
                </div>
                
                <div className="space-y-1">
                  <div className="text-2xl font-bold text-accent">
                    {profile.year || "?"}
                  </div>
                  <div className="text-xs text-muted-foreground">Year</div>
                </div>
                
                <div className="space-y-1">
                  <div className="text-2xl font-bold text-secondary">
                    ⚡
                  </div>
                  <div className="text-xs text-muted-foreground">Active</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ViewProfilePage;
