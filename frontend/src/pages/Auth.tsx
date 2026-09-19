import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";
import { Heart, Zap, Mail, Lock, User as UserIcon, Sparkles } from "lucide-react";

const Auth = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { user, isProfileComplete, loading: authLoading } = useAuth();

  // If user is already authenticated, redirect cleanly based on profile completeness
  useEffect(() => {
    if (!authLoading && user) {
      if (isProfileComplete) {
        navigate("/", { replace: true });
      } else {
        navigate("/profile", { replace: true });
      }
    }
  }, [user, isProfileComplete, authLoading, navigate]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center auth-bg relative overflow-hidden">
        <div className="text-center relative z-10">
          <div className="w-10 h-10 border-4 border-white/30 border-t-white rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white/90 font-medium">Checking authentication...</p>
        </div>
      </div>
    );
  }

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("📝 Sign up initiated");
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: {
            name: name
          }
        }
      });

      console.log("📝 Sign up response:", { data, error });

      if (error) {
        console.error("❌ Sign up error:", error);
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive"
        });
      } else {
        console.log("✅ Sign up successful");
        toast({
          title: "Success! ✨",
          description: "Check your email to confirm your account"
        });
      }
    } catch (err) {
      console.error("❌ Exception during sign up:", err);
      toast({
        title: "Error",
        description: "An unexpected error occurred during sign up",
        variant: "destructive"
      });
    }
    
    setLoading(false);
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("🔐 Sign in initiated");
    setLoading(true);
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      console.log("🔑 Supabase auth response:", { data, error });

      if (error) {
        console.error("❌ Authentication error:", error);
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive"
        });
        setLoading(false);
      } else {
        console.log("✅ Authentication successful:", data);
        toast({
          title: "Welcome back! ⚡",
          description: "Successfully signed in"
        });
        // Don't set loading to false here - let the auth state change handler handle it
      }
    } catch (err) {
      console.error("❌ Exception during sign in:", err);
      toast({
        title: "Error",
        description: "An unexpected error occurred during sign in",
        variant: "destructive"
      });
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!email) {
      toast({
        title: "Email required",
        description: "Please enter your email address above to receive a reset link.",
        variant: "destructive"
      });
      return;
    }
    
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/update-password`,
      });

      if (error) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive"
        });
      } else {
        toast({
          title: "Reset link sent! 📧",
          description: "Check your email for the password reset link."
        });
      }
    } catch (err) {
      toast({
        title: "Error",
        description: "An unexpected error occurred.",
        variant: "destructive"
      });
    }
    setLoading(false);
  };

  const handleButtonClick = (e: React.MouseEvent) => {
    console.log("🔘 Button clicked - event handler triggered");
    console.log("Event type:", e.type);
    console.log("Button disabled:", loading);
    console.log("Email state:", email);
    console.log("Password state:", password);
  };

  return (
    <div className="min-h-screen flex items-center justify-center auth-bg p-4 relative overflow-hidden">
      {/* Enhanced Background Effects */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Floating Orbs */}
        <div className="floating-orb"></div>
        <div className="floating-orb"></div>
        <div className="floating-orb"></div>
        
        {/* Particle Effects */}
        {[...Array(10)].map((_, i) => (
          <div
            key={i}
            className="particle"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${i * 0.6}s`,
            }}
          />
        ))}
      </div>

      <Card className="card-enhanced w-full max-w-md relative z-10 animate-fadeInScale">
        <CardHeader className="text-center pb-8">
          {/* Logo with enhanced styling */}
          <div className="flex justify-center items-center mb-4">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-primary to-secondary rounded-full blur-lg opacity-50 animate-pulse"></div>
              <div className="relative bg-gradient-to-r from-primary to-secondary p-3 rounded-full">
                <Heart className="w-8 h-8 text-white" fill="currentColor" />
              </div>
            </div>
          </div>
          
          <CardTitle className="text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r from-primary via-accent to-secondary bg-clip-text text-transparent text-center mb-2">
            ⚡ Heartbeat@Campus
          </CardTitle>
          
          <CardDescription className="text-xs sm:text-sm md:text-base bg-gradient-to-r from-white to-white/80 bg-clip-text text-transparent text-center font-medium">
            College ka pyaar, semester jaisa — short & intense
          </CardDescription>
          
          {/* Feature highlights */}
          <div className="flex justify-center items-center gap-6 mt-6 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Zap className="w-3 h-3 text-accent" />
              <span>Instant Match</span>
            </div>
            <div className="flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-secondary" />
              <span>Campus Only</span>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          <Tabs defaultValue="signin" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6 bg-muted/30 backdrop-blur-sm rounded-[var(--radius)]">
              <TabsTrigger 
                value="signin" 
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-primary/80 data-[state=active]:text-white transition-all duration-300"
              >
                Sign In
              </TabsTrigger>
              <TabsTrigger 
                value="signup"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-secondary data-[state=active]:to-secondary/80 data-[state=active]:text-white transition-all duration-300"
              >
                Sign Up
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="signin" className="space-y-5">
              <form onSubmit={handleSignIn} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium flex items-center gap-2">
                    <Mail className="w-4 h-4 text-primary" />
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="input-enhanced focus:border-primary focus:ring-primary/20"
                    placeholder="Enter your email"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-medium flex items-center gap-2">
                    <Lock className="w-4 h-4 text-primary" />
                    Password
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="input-enhanced focus:border-primary focus:ring-primary/20"
                    placeholder="Enter your password"
                  />
                  <div className="flex justify-end pt-1">
                    <button
                      type="button"
                      onClick={handleResetPassword}
                      className="text-xs text-primary hover:text-primary/80 transition-colors bg-transparent border-none p-0 cursor-pointer"
                      disabled={loading}
                    >
                      Forgot Password?
                    </button>
                  </div>
                </div>
                <Button 
                  type="submit" 
                  className="btn-primary-enhanced w-full py-3 text-base font-semibold"
                  disabled={loading}
                  onClick={handleButtonClick}
                >
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                      Signing in...
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Heart className="w-4 h-4" fill="currentColor" />
                      Sign In
                    </div>
                  )}
                </Button>
              </form>
            </TabsContent>
            
            <TabsContent value="signup" className="space-y-5">
              <form onSubmit={handleSignUp} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-sm font-medium flex items-center gap-2">
                    <UserIcon className="w-4 h-4 text-secondary" />
                    Full Name
                  </Label>
                  <Input
                    id="name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="input-enhanced focus:border-secondary focus:ring-secondary/20"
                    placeholder="Enter your full name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-email" className="text-sm font-medium flex items-center gap-2">
                    <Mail className="w-4 h-4 text-secondary" />
                    Email
                  </Label>
                  <Input
                    id="signup-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="input-enhanced focus:border-secondary focus:ring-secondary/20"
                    placeholder="Enter your email"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password" className="text-sm font-medium flex items-center gap-2">
                    <Lock className="w-4 h-4 text-secondary" />
                    Password
                  </Label>
                  <Input
                    id="signup-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                    className="input-enhanced focus:border-secondary focus:ring-secondary/20"
                    placeholder="Create a password (min. 6 characters)"
                  />
                </div>
                <Button 
                  type="submit" 
                  className="btn-secondary-enhanced w-full py-3 text-base font-semibold bg-gradient-to-r from-secondary to-secondary/80 hover:from-secondary/90 hover:to-secondary text-white"
                  disabled={loading}
                >
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                      Creating account...
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4" />
                      Create Account
                    </div>
                  )}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
          
          {/* Footer message */}
          <div className="text-center mt-8 pt-6 border-t border-border/50">
            <p className="text-xs text-muted-foreground">
              By continuing, you agree to find your campus crush! ⚡
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;
