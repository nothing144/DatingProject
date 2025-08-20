import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { User, Camera, Save, Plus, X, Heart, MapPin, Mail, Zap, Sparkles, Trash2 } from "lucide-react";

const Profile = () => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState({
    name: "",
    username: "",
    age: "",
    location: "",
    description: "",
    shortBio: "",
    interests: [] as string[],
    avatar_url: ""
  });
  const [newInterest, setNewInterest] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user || null);
      if (!session) {
        navigate("/auth");
      } else {
        fetchProfile(session.user.id);
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user || null);
      if (!session) {
        navigate("/auth");
      } else {
        fetchProfile(session.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, name, username, age, location, description, shortBio, interests, avatar_url")
        .eq("id", userId)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        setProfile({
          name: data.name || "",
          username: data.username || "",
          age: data.age?.toString() || "",
          location: data.location || "",
          description: data.description || "",
          shortBio: data.shortBio || "",
          interests: data.interests || [],
          avatar_url: data.avatar_url || ""
        });
      }
    } catch (error: any) {
      console.error("Error fetching profile:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!user) return;
    
    // Validate username uniqueness if provided
    if (profile.username) {
      const { data: existingUser, error: checkError } = await supabase
        .from("profiles")
        .select("id")
        .eq("username", profile.username)
        .neq("id", user.id)
        .single();

      if (checkError && checkError.code !== 'PGRST116') {
        toast({
          title: "Error",
          description: "Failed to validate username",
          variant: "destructive"
        });
        return;
      }

      if (existingUser) {
        toast({
          title: "Username taken",
          description: "This username is already taken. Please choose another.",
          variant: "destructive"
        });
        return;
      }
    }
    
    setSaving(true);
    try {
      const profileData = {
        id: user.id,
        name: profile.name,
        username: profile.username || null,
        age: profile.age ? parseInt(profile.age) : null,
        location: profile.location,
        description: profile.description,
        shortBio: profile.shortBio,
        interests: profile.interests,
        avatar_url: profile.avatar_url,
        email: user.email
      };

      const { error } = await supabase
        .from("profiles")
        .upsert(profileData);

      if (error) throw error;

      toast({
        title: "Profile Saved! ✨",
        description: "Your profile has been updated successfully."
      });
      
      navigate("/");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const addInterest = () => {
    if (newInterest.trim() && !profile.interests.includes(newInterest.trim())) {
      setProfile(prev => ({
        ...prev,
        interests: [...prev.interests, newInterest.trim()]
      }));
      setNewInterest("");
    }
  };

  const removeInterest = (interest: string) => {
    setProfile(prev => ({
      ...prev,
      interests: prev.interests.filter(i => i !== interest)
    }));
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    // Validate file type and size
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    const maxSize = 5 * 1024 * 1024; // 5MB

    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Invalid file type",
        description: "Please upload a JPEG, PNG, or WebP image.",
        variant: "destructive"
      });
      return;
    }

    if (file.size > maxSize) {
      toast({
        title: "File too large",
        description: "Please upload an image smaller than 5MB.",
        variant: "destructive"
      });
      return;
    }

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        throw uploadError;
      }

      const { data: urlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      if (urlData?.publicUrl) {
        if (profile.avatar_url && profile.avatar_url.includes('supabase')) {
          const oldFileName = profile.avatar_url.split('/').pop();
          if (oldFileName) {
            await supabase.storage
              .from('avatars')
              .remove([`avatars/${oldFileName}`]);
          }
        }

        setProfile(prev => ({
          ...prev,
          avatar_url: urlData.publicUrl
        }));

        toast({
          title: "Photo Updated! 📸",
          description: "Your profile photo has been updated successfully."
        });
      }
    } catch (error: any) {
      console.error('Upload error:', error);
      toast({
        title: "Upload Failed",
        description: error.message || "Failed to upload image. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleDeleteProfile = async () => {
    if (!user) return;
    
    const confirmDelete = window.confirm(
      "Are you sure you want to delete your profile? This action cannot be undone and will remove all your data including messages, date requests, and announcements."
    );
    
    if (!confirmDelete) return;
    
    setSaving(true);
    try {
      if (profile.avatar_url && profile.avatar_url.includes('supabase')) {
        const fileName = profile.avatar_url.split('/').pop();
        if (fileName) {
          await supabase.storage
            .from('avatars')
            .remove([`avatars/${fileName}`]);
        }
      }

      const { error: profileError } = await supabase
        .from("profiles")
        .delete()
        .eq("id", user.id);

      if (profileError) throw profileError;

      const { data: session } = await supabase.auth.getSession();
      if (session?.session?.access_token) {
        try {
          const response = await fetch(`${supabase.supabaseUrl}/functions/v1/delete-user`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${session.session.access_token}`,
              'Content-Type': 'application/json',
            },
          });

          if (!response.ok) {
            console.warn('Could not delete auth user via edge function:', await response.text());
          }
        } catch (edgeError) {
          console.warn('Edge function not available, user auth record will remain:', edgeError);
        }
      }

      toast({
        title: "Profile Deleted",
        description: "Your profile and all associated data have been deleted."
      });
      
      await supabase.auth.signOut();
      navigate("/auth");
      
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-secondary/10">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-gradient-to-br from-primary to-secondary p-1">
            <div className="w-full h-full rounded-full bg-background flex items-center justify-center">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
          </div>
          <p className="text-muted-foreground">Loading your profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-secondary/10 p-4 pb-24 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/6 w-64 h-64 bg-primary/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/6 w-80 h-80 bg-secondary/20 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1s'}}></div>
      </div>

      <div className="container mx-auto max-w-md relative z-10">
        {/* Enhanced Header */}
        <div className="text-center mb-8 pt-6">
          <div className="flex justify-center items-center mb-4">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-primary to-secondary rounded-full blur-lg opacity-50 animate-pulse"></div>
              <div className="relative bg-gradient-to-r from-primary to-secondary p-3 rounded-full">
                <User className="w-8 h-8 text-white" />
              </div>
            </div>
          </div>
          <h1 className="heading-primary text-center mb-2">
            Your Profile
          </h1>
          <p className="text-gradient text-center text-base font-medium">Make yourself shine ⚡</p>
        </div>

        <Card className="card-enhanced animate-fadeInScale">
          <CardHeader className="pb-6">
            <CardTitle className="flex items-center gap-3 text-xl">
              <div className="p-2 bg-gradient-to-br from-primary to-secondary rounded-lg">
                <Heart className="w-5 h-5 text-white" />
              </div>
              Profile Setup
            </CardTitle>
          </CardHeader>
          
          <CardContent className="space-y-8">
            {/* Enhanced Profile Photo Section */}
            <div className="text-center">
              <div className="relative inline-block group">
                <div className="w-28 h-28 rounded-full bg-gradient-to-br from-primary via-accent to-secondary p-1">
                  <div className="w-full h-full rounded-full bg-card/90 backdrop-blur-sm flex items-center justify-center overflow-hidden">
                    {profile.avatar_url ? (
                      <img
                        src={profile.avatar_url}
                        alt="Profile"
                        className="w-full h-full object-cover transition-transform group-hover:scale-110"
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center text-muted-foreground">
                        <Camera className="w-8 h-8 mb-2" />
                        <span className="text-xs">Add Photo</span>
                      </div>
                    )}
                  </div>
                </div>
                
                <label
                  htmlFor="photo-upload"
                  className="absolute -bottom-2 -right-2 w-10 h-10 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center cursor-pointer hover:scale-110 transition-all duration-300 shadow-lg group"
                >
                  <Camera className="w-5 h-5 text-white group-hover:scale-110 transition-transform" />
                </label>
                
                <input
                  id="photo-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </div>
              <p className="text-sm text-muted-foreground mt-3 bg-muted/20 px-4 py-2 rounded-full inline-block">
                📸 Tap the camera icon to add or change your photo
              </p>
            </div>

            {/* Enhanced Form Fields */}
            <div className="space-y-6">
              {/* Name Field */}
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-semibold text-primary flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Full Name *
                </Label>
                <Input
                  id="name"
                  value={profile.name}
                  onChange={(e) => setProfile(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter your full name"
                  className="input-enhanced focus:border-primary focus:ring-primary/20"
                />
              </div>

              {/* Username Field */}
              <div className="space-y-2">
                <Label htmlFor="username" className="text-sm font-semibold text-accent flex items-center gap-2">
                  <Zap className="w-4 h-4" />
                  Username
                </Label>
                <Input
                  id="username"
                  value={profile.username}
                  onChange={(e) => setProfile(prev => ({ ...prev, username: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '') }))}
                  placeholder="Choose a unique username"
                  className="input-enhanced focus:border-accent focus:ring-accent/20"
                />
                <p className="text-xs text-muted-foreground bg-muted/20 px-3 py-2 rounded-lg">
                  💫 Only lowercase letters, numbers, and underscores allowed
                </p>
              </div>

              {/* Age and Location */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="age" className="text-sm font-semibold text-secondary flex items-center gap-2">
                    <Heart className="w-4 h-4" />
                    Age
                  </Label>
                  <Input
                    id="age"
                    type="number"
                    value={profile.age}
                    onChange={(e) => setProfile(prev => ({ ...prev, age: e.target.value }))}
                    placeholder="Age"
                    className="input-enhanced focus:border-secondary focus:ring-secondary/20"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="location" className="text-sm font-semibold text-secondary flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    Location
                  </Label>
                  <Input
                    id="location"
                    value={profile.location}
                    onChange={(e) => setProfile(prev => ({ ...prev, location: e.target.value }))}
                    placeholder="City, State"
                    className="input-enhanced focus:border-secondary focus:ring-secondary/20"
                  />
                </div>
              </div>

              {/* Short Bio */}
              <div className="space-y-2">
                <Label htmlFor="shortBio" className="text-sm font-semibold text-accent flex items-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  Short Bio
                </Label>
                <Input
                  id="shortBio"
                  value={profile.shortBio}
                  onChange={(e) => setProfile(prev => ({ ...prev, shortBio: e.target.value }))}
                  placeholder="A quick intro about yourself..."
                  className="input-enhanced focus:border-accent focus:ring-accent/20"
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description" className="text-sm font-semibold text-primary flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  About You
                </Label>
                <Textarea
                  id="description"
                  value={profile.description}
                  onChange={(e) => setProfile(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Tell people more about yourself..."
                  className="input-enhanced focus:border-primary focus:ring-primary/20 min-h-[100px] resize-none"
                />
              </div>

              {/* Enhanced Interests */}
              <div className="space-y-3">
                <Label className="text-sm font-semibold text-secondary flex items-center gap-2">
                  <Heart className="w-4 h-4" />
                  Interests & Hobbies
                </Label>
                
                <div className="flex gap-2">
                  <Input
                    value={newInterest}
                    onChange={(e) => setNewInterest(e.target.value)}
                    placeholder="Add an interest..."
                    className="input-enhanced focus:border-secondary focus:ring-secondary/20 flex-1"
                    onKeyPress={(e) => e.key === 'Enter' && addInterest()}
                  />
                  <Button
                    onClick={addInterest}
                    size="icon"
                    className="btn-secondary-enhanced w-12 h-12 rounded-full"
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                
                <div className="flex flex-wrap gap-2 p-4 bg-muted/20 rounded-[var(--radius-lg)] min-h-[60px]">
                  {profile.interests.length === 0 ? (
                    <p className="text-sm text-muted-foreground italic">Add interests to help others discover you! ⚡</p>
                  ) : (
                    profile.interests.map((interest, index) => (
                      <Badge
                        key={index}
                        variant="secondary"
                        className="bg-secondary/20 text-secondary border border-secondary/30 hover:bg-secondary/30 group px-3 py-2 text-sm"
                      >
                        {interest}
                        <button
                          onClick={() => removeInterest(interest)}
                          className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity hover:text-destructive"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </Badge>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Enhanced Action Buttons */}
            <div className="space-y-3 pt-6">
              <Button
                onClick={handleSave}
                disabled={saving || !profile.name}
                className="btn-primary-enhanced w-full py-4 text-base font-semibold"
              >
                {saving ? (
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                    Saving your profile...
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <Save className="w-5 h-5" />
                    Save Profile
                  </div>
                )}
              </Button>
              
              <div className="grid grid-cols-2 gap-3">
                <Button
                  variant="outline"
                  onClick={() => navigate("/")}
                  className="btn-secondary-enhanced py-3"
                >
                  Cancel
                </Button>
                
                <Button
                  variant="destructive"
                  onClick={handleDeleteProfile}
                  disabled={saving}
                  className="py-3 bg-destructive hover:bg-destructive-hover text-destructive-foreground font-semibold transition-all duration-300 hover:scale-105"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Profile;