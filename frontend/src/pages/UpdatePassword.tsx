import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { Lock, Heart } from "lucide-react";

const UpdatePassword = () => {
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if we actually have a session to update the password for
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast({
          title: "Invalid link",
          description: "This password reset link is invalid or has expired.",
          variant: "destructive",
        });
        navigate("/auth", { replace: true });
      }
    };
    checkSession();
  }, [navigate]);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password || password.length < 6) {
      toast({
        title: "Invalid password",
        description: "Password must be at least 6 characters long.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: password,
      });

      if (error) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Password updated! ✨",
          description: "Your password has been successfully updated. You can now log in.",
        });
        // Sign out so they can log in with new password cleanly, or just redirect
        await supabase.auth.signOut();
        navigate("/auth", { replace: true });
      }
    } catch (err) {
      toast({
        title: "Error",
        description: "An unexpected error occurred.",
        variant: "destructive",
      });
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center auth-bg p-4 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="floating-orb"></div>
        <div className="floating-orb"></div>
      </div>

      <Card className="card-enhanced w-full max-w-md relative z-10 animate-fadeInScale">
        <CardHeader className="text-center pb-8">
          <div className="flex justify-center items-center mb-4">
            <div className="relative bg-gradient-to-r from-primary to-secondary p-3 rounded-full">
              <Lock className="w-8 h-8 text-white" fill="currentColor" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold bg-gradient-to-r from-primary via-accent to-secondary bg-clip-text text-transparent mb-2">
            Reset Password
          </CardTitle>
          <CardDescription className="text-sm bg-gradient-to-r from-white to-white/80 bg-clip-text text-transparent">
            Enter your new password below.
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleUpdatePassword} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="new-password" className="text-sm font-medium flex items-center gap-2">
                <Lock className="w-4 h-4 text-primary" />
                New Password
              </Label>
              <Input
                id="new-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="input-enhanced focus:border-primary focus:ring-primary/20"
                placeholder="Enter new password"
              />
            </div>
            
            <Button 
              type="submit" 
              className="btn-primary-enhanced w-full py-3 text-base font-semibold"
              disabled={loading}
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  Updating...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Heart className="w-4 h-4" fill="currentColor" />
                  Update Password
                </div>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default UpdatePassword;
