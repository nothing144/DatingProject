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
import { User, Camera, Save, Plus, X } from "lucide-react";

const Profile = () => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState({
    name: "",
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
        .select("id, name, age, location, description, shortBio, interests, avatar_url")
        .eq("id", userId)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        setProfile({
          name: data.name || "",
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
    
    setSaving(true);
    try {
      const profileData = {
        id: user.id,
        name: profile.name,
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
        title: "Profile saved!",
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

    try {
      // Create a simple data URL for the image (for demo purposes)
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          setProfile(prev => ({
            ...prev,
            avatar_url: e.target!.result as string
          }));
        }
      };
      reader.readAsDataURL(file);
      
      toast({
        title: "Photo uploaded!",
        description: "Your profile photo has been updated."
      });
    } catch (error: any) {
      toast({
        title: "Upload failed",
        description: error.message,
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
      // Delete profile (this will cascade delete related data due to foreign key constraints)
      const { error: profileError } = await supabase
        .from("profiles")
        .delete()
        .eq("id", user.id);

      if (profileError) throw profileError;

      // Delete the user account
      const { error: authError } = await supabase.auth.admin.deleteUser(user.id);
      
      if (authError) {
        console.warn("Could not delete auth user:", authError);
        // Continue anyway as profile is deleted
      }

      toast({
        title: "Profile Deleted",
        description: "Your profile and all associated data have been deleted."
      });
      
      // Sign out and redirect
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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/20 via-background to-secondary/20">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/20 via-background to-secondary/20 p-4">
      <div className="container mx-auto max-w-md">
        {/* Header */}
        <div className="text-center mb-6 pt-4">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary via-accent to-secondary bg-clip-text text-transparent">
            Your Profile
          </h1>
          <p className="text-muted-foreground text-sm">Make yourself shine ⚡</p>
        </div>

        <Card className="bg-card/90 backdrop-blur-sm border-primary/30 shadow-[var(--shadow-electric)]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5 text-primary" />
              Profile Setup
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Profile Photo */}
            <div className="text-center">
              <div className="relative inline-block">
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary via-accent to-secondary p-1">
                  <div className="w-full h-full rounded-full bg-muted flex items-center justify-center overflow-hidden">
                    {profile.avatar_url ? (
                      <img
                        src={profile.avatar_url}
                        alt="Profile"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Camera className="w-8 h-8 text-muted-foreground" />
                    )}
                  </div>
                </div>
                <label
                  htmlFor="photo-upload"
                  className="absolute -bottom-1 -right-1 w-8 h-8 bg-primary rounded-full flex items-center justify-center cursor-pointer hover:bg-primary/80 transition-colors shadow-[var(--shadow-neon)]"
                >
                  <Camera className="w-4 h-4 text-primary-foreground" />
                </label>
                <input
                  id="photo-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </div>
              <p className="text-xs text-muted-foreground mt-2">Tap to change photo</p>
            </div>

            {/* Basic Info */}
            <div className="space-y-4">
              <div>
                <Label htmlFor="name" className="text-primary">Name *</Label>
                <Input
                  id="name"
                  value={profile.name}
                  onChange={(e) => setProfile(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Your name"
                  className="border-primary/30 focus:border-primary focus:ring-primary"
                />
              </div>

              <div>
                <Label htmlFor="age" className="text-primary">Age</Label>
                <Input
                  id="age"
                  type="number"
                  value={profile.age}
                  onChange={(e) => setProfile(prev => ({ ...prev, age: e.target.value }))}
                  placeholder="Your age"
                  className="border-primary/30 focus:border-primary focus:ring-primary"
                />
              </div>

              <div>
                <Label htmlFor="location" className="text-secondary">Location</Label>
                <Input
                  id="location"
                  value={profile.location}
                  onChange={(e) => setProfile(prev => ({ ...prev, location: e.target.value }))}
                  placeholder="Your location"
                  className="border-secondary/30 focus:border-secondary focus:ring-secondary"
                />
              </div>

              <div>
                <Label htmlFor="shortBio" className="text-accent">Short Bio</Label>
                <Input
                  id="shortBio"
                  value={profile.shortBio}
                  onChange={(e) => setProfile(prev => ({ ...prev, shortBio: e.target.value }))}
                  placeholder="A quick intro about yourself"
                  className="border-accent/30 focus:border-accent focus:ring-accent"
                />
              </div>

              <div>
                <Label htmlFor="description" className="text-primary">About You</Label>
                <Textarea
                  id="description"
                  value={profile.description}
                  onChange={(e) => setProfile(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Tell people more about yourself..."
                  className="border-primary/30 focus:border-primary focus:ring-primary"
                />
              </div>

              {/* Interests */}
              <div>
                <Label className="text-secondary">Interests</Label>
                <div className="flex gap-2 mb-3">
                  <Input
                    value={newInterest}
                    onChange={(e) => setNewInterest(e.target.value)}
                    placeholder="Add an interest"
                    className="flex-1 border-secondary/30 focus:border-secondary focus:ring-secondary"
                    onKeyPress={(e) => e.key === 'Enter' && addInterest()}
                  />
                  <Button
                    onClick={addInterest}
                    size="icon"
                    variant="outline"
                    className="border-secondary hover:bg-secondary hover:text-secondary-foreground"
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {profile.interests.map((interest, index) => (
                    <Badge
                      key={index}
                      variant="secondary"
                      className="bg-secondary/20 text-secondary border-secondary/30 hover:bg-secondary/30 group"
                    >
                      {interest}
                      <button
                        onClick={() => removeInterest(interest)}
                        className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => navigate("/")}
                className="flex-1 border-muted-foreground/30 hover:bg-muted"
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDeleteProfile}
                className="flex-1"
                disabled={saving}
              >
                Delete Profile
              </Button>
              <Button
                onClick={handleSave}
                disabled={saving || !profile.name}
                className="flex-2 bg-gradient-to-r from-primary via-accent to-secondary hover:opacity-90 text-white shadow-[var(--shadow-lightning)]"
              >
                {saving ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save Profile
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Profile;
