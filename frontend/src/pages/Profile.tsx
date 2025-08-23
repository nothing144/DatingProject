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
    avatar_url: "",
    branch: "",
    year: ""
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
        .select("id, name, username, age, location, description, shortBio, interests, avatar_url, branch, year")
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

      // Note: We skip client-side deletion of old image for security reasons
      // The old image will remain in Cloudinary but won't be referenced in the database
      // When the user deletes their account, the edge function will handle proper cleanup
      if (profile.avatar_url && isCloudinaryUrl(profile.avatar_url)) {
        console.log("ℹ️ Old Cloudinary image will be replaced but not deleted (security limitation)");
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
      "Are you sure you want to delete your profile? This action cannot be undone and will remove all your data including messages, date requests, announcements, and your Cloudinary images. Your authentication will also be completely removed."
    );
    
    if (!confirmDelete) return;
    
    setSaving(true);
    
    try {
      console.log("🚀 Starting complete profile deletion process...");
      
      // Show progress to user
      toast({
        title: "Deleting Account...",
        description: "This may take a moment. Please don't close the browser."
      });

      // Step 1: Call the improved edge function that handles everything
      const { data: session } = await supabase.auth.getSession();
      if (session?.session?.access_token) {
        console.log("📡 Calling edge function for complete user deletion...");
        
        const edgeFunctionUrl = `${supabase.supabaseUrl}/functions/v1/delete-user`;
        console.log("🔗 Edge function URL:", edgeFunctionUrl);
        
        const response = await fetch(edgeFunctionUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.session.access_token}`,
            'Content-Type': 'application/json',
            'x-client-info': 'heartbeat-web',
          },
          mode: 'cors',
        });

        console.log("📡 Edge function response status:", response.status);

        if (response.ok) {
          const result = await response.json();
          console.log("✅ Edge function completed successfully:", result);
          
          // Show detailed success message
          const details = result.details || {};
          const dbSuccess = details.databaseRecords ? Object.values(details.databaseRecords).filter(Boolean).length : 0;
          const dbTotal = details.databaseRecords ? Object.keys(details.databaseRecords).length : 0;
          
          toast({
            title: "Account Completely Deleted! ✅",
            description: `Successfully deleted your account including:
            • Authentication: ${details.authUser ? '✅' : '❌'}
            • Cloudinary Images: ${details.cloudinaryImage ? '✅' : '❌'}
            • Database Records: ${dbSuccess}/${dbTotal}
            You can now create a new account if desired.`
          });
          
          console.log("🎉 Complete account deletion successful");
          
        } else {
          const errorData = await response.text();
          console.error("❌ Edge function failed:", response.status, errorData);
          
          let errorMessage;
          try {
            const parsedError = JSON.parse(errorData);
            errorMessage = parsedError.error || parsedError.message || 'Unknown error';
          } catch {
            errorMessage = errorData || 'Unknown error';
          }
          
          // If edge function failed, fall back to manual cleanup
          console.log("🔄 Falling back to manual cleanup...");
          await performManualCleanup();
          
          toast({
            title: "Partial Deletion Completed",
            description: `Edge function failed (${errorMessage}), but manual cleanup was performed.`,
            variant: "destructive"
          });
        }
      } else {
        console.warn("⚠️ No session found, performing manual cleanup...");
        await performManualCleanup();
      }
      
    } catch (error: any) {
      console.error("❌ Complete deletion error:", error);
      
      // Fall back to manual cleanup
      console.log("🔄 Falling back to manual cleanup due to error...");
      await performManualCleanup();
    } finally {
      // Always clean up and redirect
      try {
        await supabase.auth.signOut();
      } catch (signOutError) {
        console.warn("⚠️ Error during sign out:", signOutError);
      }
      
      // Clear local storage and redirect
      localStorage.clear();
      sessionStorage.clear();
      
      // Redirect after a short delay to ensure toast is seen
      setTimeout(() => {
        window.location.href = "/auth";
      }, 2000);
      
      setSaving(false);
    }
  };

  // Helper function to extract public_id from Cloudinary URL
  const extractPublicIdFromUrl = (url: string): string | null => {
    if (!url || !url.includes('cloudinary.com')) {
      return null;
    }
    
    try {
      const urlParts = url.split('/');
      const uploadIndex = urlParts.indexOf('upload');
      
      if (uploadIndex === -1) return null;
      
      // Get everything after 'upload' and potential transformations
      let pathAfterUpload = urlParts.slice(uploadIndex + 1).join('/');
      
      // Remove transformation parameters (they start with letters like w_, h_, etc.)
      const transformationRegex = /^[a-z]_[^\/]+,?/;
      while (transformationRegex.test(pathAfterUpload)) {
        pathAfterUpload = pathAfterUpload.replace(/^[^\/]+\//, '');
      }
      
      // Remove file extension
      const publicId = pathAfterUpload.replace(/\.[^.]+$/, '');
      
      return publicId;
    } catch (error) {
      console.error('Error extracting public_id from URL:', error);
      return null;
    }
  };

  // Helper function to generate Cloudinary signature
  const generateCloudinarySignature = async (publicId: string, timestamp: number, apiSecret: string): Promise<string> => {
    const paramsToSign = `public_id=${publicId}&timestamp=${timestamp}${apiSecret}`;
    
    // Use Web Crypto API for SHA-1 hashing
    const encoder = new TextEncoder();
    const data = encoder.encode(paramsToSign);
    const hashBuffer = await crypto.subtle.digest('SHA-1', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    
    return hashHex;
  };

  // Helper function to delete image from Cloudinary (manual version)
  const deleteImageFromCloudinaryManual = async (avatarUrl: string): Promise<{ success: boolean; error?: string }> => {
    try {
      console.log('🖼️ Attempting manual Cloudinary deletion...');
      
      // SECURITY WARNING: This manual deletion should not be used in production
      // Image deletion should be handled by secure edge functions only
      console.warn('⚠️ Manual Cloudinary deletion is insecure and should not be used in production');
      
      const CLOUDINARY_CONFIG = {
        cloud_name: import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || 'dlnatlmdq',
        api_key: import.meta.env.VITE_CLOUDINARY_API_KEY || '855887866717832',
        // API_SECRET removed from frontend for security
        api_secret: '', // This should never be in frontend code
      };

      const publicId = extractPublicIdFromUrl(avatarUrl);
      if (!publicId) {
        console.warn('⚠️ Could not extract public_id from Cloudinary URL');
        return { success: false, error: 'Could not extract public_id' };
      }

      if (!CLOUDINARY_CONFIG.api_secret) {
        console.warn('⚠️ Cloudinary API secret not available in frontend, skipping image deletion');
        return { success: false, error: 'API secret not available in frontend' };
      }

      const timestamp = Math.round(Date.now() / 1000);
      const signature = await generateCloudinarySignature(publicId, timestamp, CLOUDINARY_CONFIG.api_secret);

      const formData = new FormData();
      formData.append('public_id', publicId);
      formData.append('api_key', CLOUDINARY_CONFIG.api_key);
      formData.append('timestamp', timestamp.toString());
      formData.append('signature', signature);

      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUDINARY_CONFIG.cloud_name}/image/destroy`,
        {
          method: 'POST',
          body: formData,
        }
      );

      const result = await response.json();
      
      if (response.ok && result.result === 'ok') {
        console.log(`✅ Cloudinary image deleted manually: ${publicId}`);
        return { success: true };
      } else {
        console.warn(`⚠️ Manual Cloudinary deletion failed for ${publicId}:`, result);
        return { success: false, error: result.error?.message || 'Deletion failed' };
      }
    } catch (error: any) {
      console.error(`❌ Error in manual Cloudinary deletion:`, error);
      return { success: false, error: error.message };
    }
  };

  // Fallback manual cleanup function
  const performManualCleanup = async () => {
    console.log("🔧 Performing manual profile data cleanup...");
    
    const deletionResults = {
      messages: false,
      conversations: false,
      dateRequests: false,
      announcements: false,
      confessions: false,
      notifications: false,
      favorites: false,
      profile: false,
      cloudinaryImage: false,
    };
    
    // Delete related data (wrap each in try-catch to prevent one failure from stopping others)
    
    // Step 1: Get user's avatar for Cloudinary deletion
    let avatarUrl = null;
    try {
      console.log('📸 Fetching user profile for avatar deletion...');
      const { data: profileData } = await supabase
        .from('profiles')
        .select('avatar_url')
        .eq('id', user.id)
        .single();
      
      avatarUrl = profileData?.avatar_url;
      console.log(`📸 User avatar URL: ${avatarUrl || 'none'}`);
    } catch (error) {
      console.warn('⚠️ Could not fetch user profile for avatar deletion:', error);
    }

    // Step 2: Delete avatar from Cloudinary if it exists
    if (avatarUrl && avatarUrl.includes('cloudinary.com')) {
      console.log('🖼️ Processing manual Cloudinary image deletion...');
      const cloudinaryResult = await deleteImageFromCloudinaryManual(avatarUrl);
      deletionResults.cloudinaryImage = cloudinaryResult.success;
      if (cloudinaryResult.success) {
        console.log('✅ Cloudinary image deleted manually');
      } else {
        console.warn('⚠️ Manual Cloudinary image deletion failed:', cloudinaryResult.error);
      }
    } else {
      console.log('ℹ️ No Cloudinary image to delete');
      deletionResults.cloudinaryImage = true; // Mark as success since no image to delete
    }
    
    // Step 3: Delete database records
    
    // Delete messages sent by user
    try {
      const { error: messagesError } = await supabase
        .from("messages")
        .delete()
        .eq("sender_id", user.id);
      
      if (!messagesError) {
        deletionResults.messages = true;
        console.log("✅ Messages deleted");
      } else {
        console.warn("⚠️ Error deleting messages:", messagesError);
      }
    } catch (err) {
      console.warn("⚠️ Exception deleting messages:", err);
    }

    // Delete conversations where user is participant
    try {
      const { error: conversationsError } = await supabase
        .from("conversations")
        .delete()
        .or(`participant_1.eq.${user.id},participant_2.eq.${user.id}`);
      
      if (!conversationsError) {
        deletionResults.conversations = true;
        console.log("✅ Conversations deleted");
      } else {
        console.warn("⚠️ Error deleting conversations:", conversationsError);
      }
    } catch (err) {
      console.warn("⚠️ Exception deleting conversations:", err);
    }

    // Delete date requests
    try {
      const { error: dateRequestsError } = await supabase
        .from("date_requests")
        .delete()
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`);
      
      if (!dateRequestsError) {
        deletionResults.dateRequests = true;
        console.log("✅ Date requests deleted");
      } else {
        console.warn("⚠️ Error deleting date requests:", dateRequestsError);
      }
    } catch (err) {
      console.warn("⚠️ Exception deleting date requests:", err);
    }

    // Delete announcements
    try {
      const { error: announcementsError } = await supabase
        .from("announcements")
        .delete()
        .eq("author_id", user.id);
      
      if (!announcementsError) {
        deletionResults.announcements = true;
        console.log("✅ Announcements deleted");
      } else {
        console.warn("⚠️ Error deleting announcements:", announcementsError);
      }
    } catch (err) {
      console.warn("⚠️ Exception deleting announcements:", err);
    }

    // Delete confessions
    try {
      const { error: confessionsError } = await supabase
        .from("confessions")
        .delete()
        .eq("author_id", user.id);
      
      if (!confessionsError) {
        deletionResults.confessions = true;
        console.log("✅ Confessions deleted");
      } else {
        console.warn("⚠️ Error deleting confessions:", confessionsError);
      }
    } catch (err) {
      console.warn("⚠️ Exception deleting confessions:", err);
    }

    // Delete notifications
    try {
      const { error: notificationsError } = await supabase
        .from("notifications")
        .delete()
        .eq("user_id", user.id);
      
      if (!notificationsError) {
        deletionResults.notifications = true;
        console.log("✅ Notifications deleted");
      } else {
        console.warn("⚠️ Error deleting notifications:", notificationsError);
      }
    } catch (err) {
      console.warn("⚠️ Exception deleting notifications:", err);
    }

    // Delete favorites (ignore if table doesn't exist as requested by user)
    try {
      const { error: favoritesError } = await supabase
        .from("favorites")
        .delete()
        .or(`user_id.eq.${user.id},profile_id.eq.${user.id}`);
      
      if (!favoritesError) {
        deletionResults.favorites = true;
        console.log("✅ Favorites deleted");
      } else {
        // Ignore favorites table errors as requested
        console.warn("⚠️ Error deleting favorites (ignoring as requested):", favoritesError);
        deletionResults.favorites = true; // Mark as success since user said to ignore
      }
    } catch (err) {
      console.warn("⚠️ Exception deleting favorites (ignoring as requested):", err);
      deletionResults.favorites = true; // Mark as success since user said to ignore
    }

    // Finally, delete profile (this is critical)
    try {
      const { error: profileError } = await supabase
        .from("profiles")
        .delete()
        .eq("id", user.id);

      if (profileError) {
        throw new Error(`Failed to delete profile: ${profileError.message}`);
      }
      
      deletionResults.profile = true;
      console.log("✅ Profile deleted");
    } catch (err) {
      console.error("❌ Critical error deleting profile:", err);
      throw err; // This is critical, so we throw
    }
    
    // Show appropriate success message based on what was deleted
    const deletedItems = Object.values(deletionResults).filter(Boolean).length;
    const totalItems = Object.keys(deletionResults).length;
    const cloudinaryStatus = deletionResults.cloudinaryImage ? '✅' : '❌';
    
    toast({
      title: "Profile Data Deleted ✅",
      description: `Successfully deleted your profile and associated data (${deletedItems}/${totalItems} items). Cloudinary Images: ${cloudinaryStatus}`
    });
    
    console.log(`Manual profile deletion completed. Deleted ${deletedItems}/${totalItems} data types. Cloudinary: ${cloudinaryStatus}`);
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