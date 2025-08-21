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
import { 
  uploadImageToCloudinary, 
  deleteImageFromCloudinary, 
  extractPublicIdFromUrl,
  isCloudinaryUrl,
  validateImageFile 
} from "@/lib/cloudinaryUtils";

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
      const { data: existingUsers, error: checkError } = await supabase
        .from("profiles")
        .select("id")
        .eq("username", profile.username)
        .neq("id", user.id);
        
      const existingUser = existingUsers && existingUsers.length > 0 ? existingUsers[0] : null;

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

    // Validate file using Cloudinary validation
    const validation = validateImageFile(file);
    if (!validation.valid) {
      toast({
        title: "Invalid file",
        description: validation.error,
        variant: "destructive"
      });
      return;
    }

    try {
      // Show loading state
      toast({
        title: "Uploading photo...",
        description: "Please wait while we upload your image to Cloudinary."
      });

      // Delete old image from Cloudinary if it exists
      if (profile.avatar_url && isCloudinaryUrl(profile.avatar_url)) {
        const oldPublicId = extractPublicIdFromUrl(profile.avatar_url);
        if (oldPublicId) {
          await deleteImageFromCloudinary(oldPublicId);
        }
      }

      // Upload new image to Cloudinary
      const uploadResult = await uploadImageToCloudinary(file, user.id, {
        folder: 'heartbeat_avatars'
      });

      // Update profile with new Cloudinary URL
      setProfile(prev => ({
        ...prev,
        avatar_url: uploadResult.url
      }));

      toast({
        title: "Photo Updated! 📸",
        description: "Your profile photo has been uploaded to Cloudinary and optimized for better performance."
      });

    } catch (error: any) {
      console.error('Cloudinary upload error:', error);
      toast({
        title: "Upload Failed",
        description: error.message || "Failed to upload image to Cloudinary. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleDeleteProfile = async () => {
    if (!user) return;
    
    const confirmDelete = window.confirm(
      "Are you sure you want to delete your profile? This action cannot be undone and will remove all your data including messages, date requests, and announcements. Your email will also be deleted from authentication, so you'll need to sign up again if you want to use the app."
    );
    
    if (!confirmDelete) return;
    
    setSaving(true);
    try {
      // Delete image from Cloudinary if it exists
      if (profile.avatar_url && isCloudinaryUrl(profile.avatar_url)) {
        const publicId = extractPublicIdFromUrl(profile.avatar_url);
        if (publicId) {
          await deleteImageFromCloudinary(publicId);
        }
      }

      // Delete related data first (in proper order due to foreign key constraints)
      
      // Delete messages sent by user
      const { error: messagesError } = await supabase
        .from("messages")
        .delete()
        .eq("sender_id", user.id);
      
      if (messagesError) console.warn("Error deleting messages:", messagesError);

      // Delete conversations where user is participant
      const { error: conversationsError } = await supabase
        .from("conversations")
        .delete()
        .or(`participant_1.eq.${user.id},participant_2.eq.${user.id}`);
      
      if (conversationsError) console.warn("Error deleting conversations:", conversationsError);

      // Delete date requests
      const { error: dateRequestsError } = await supabase
        .from("date_requests")
        .delete()
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`);
      
      if (dateRequestsError) console.warn("Error deleting date requests:", dateRequestsError);

      // Delete announcements
      const { error: announcementsError } = await supabase
        .from("announcements")
        .delete()
        .eq("author_id", user.id);
      
      if (announcementsError) console.warn("Error deleting announcements:", announcementsError);

      // Delete confessions
      const { error: confessionsError } = await supabase
        .from("confessions")
        .delete()
        .eq("author_id", user.id);
      
      if (confessionsError) console.warn("Error deleting confessions:", confessionsError);

      // Delete notifications
      const { error: notificationsError } = await supabase
        .from("notifications")
        .delete()
        .eq("user_id", user.id);
      
      if (notificationsError) console.warn("Error deleting notifications:", notificationsError);

      // Delete favorites
      const { error: favoritesError } = await supabase
        .from("favorites")
        .delete()
        .or(`user_id.eq.${user.id},profile_id.eq.${user.id}`);
      
      if (favoritesError) console.warn("Error deleting favorites:", favoritesError);

      // Finally, delete profile
      const { error: profileError } = await supabase
        .from("profiles")
        .delete()
        .eq("id", user.id);

      if (profileError) throw profileError;

      // Try to delete auth user via edge function, but don't fail if it doesn't work
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
            console.warn('Edge function failed, user auth record will remain. Response:', await response.text());
            toast({
              title: "Profile Deleted (Partial)",
              description: "Your profile data has been deleted, but you may need to contact support to fully remove your account authentication. Images were removed from Cloudinary.",
              variant: "destructive"
            });
          } else {
            toast({
              title: "Profile Completely Deleted",
              description: "Your profile and all associated data have been completely deleted, including authentication. Images were removed from Cloudinary."
            });
          }
        } catch (edgeError) {
          console.warn('Edge function not available or failed:', edgeError);
          toast({
            title: "Profile Deleted (Data Only)",
            description: "Your profile data has been deleted and images removed from Cloudinary. Your authentication remains - you can still sign in but will need to recreate your profile.",
            variant: "destructive"
          });
        }
      } else {
        toast({
          title: "Profile Data Deleted",
          description: "Your profile data has been deleted and images removed from Cloudinary."
        });
      }
      
      // Sign out and redirect
      await supabase.auth.signOut();
      navigate("/auth");
      
    } catch (error: any) {
      console.error("Profile deletion error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete profile completely. Some data may remain.",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center profile-bg relative overflow-hidden">
        {/* Background Effects for Loading */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="floating-orb"></div>
          <div className="floating-orb"></div>
        </div>
        
        <div className="text-center relative z-10">
          <div className="relative mb-8">
            <div className="absolute inset-0 bg-gradient-to-r from-primary to-secondary rounded-full blur-xl opacity-50 animate-pulse"></div>
            <div className="relative w-20 h-20 mx-auto bg-gradient-to-r from-primary to-secondary rounded-full flex items-center justify-center">
              <div className="w-10 h-10 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
            </div>
          </div>
          <div className="bg-black/20 backdrop-blur-sm px-6 py-3 rounded-full border border-white/10">
            <p className="text-white/90 font-medium">Loading your profile...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen profile-bg p-4 pb-24 relative overflow-hidden">
      {/* Enhanced Background Effects */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Floating Orbs */}
        <div className="floating-orb"></div>
        <div className="floating-orb"></div>
        <div className="floating-orb"></div>
        
        {/* Particle Effects */}
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className="particle"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${i * 0.7}s`,
            }}
          />
        ))}
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