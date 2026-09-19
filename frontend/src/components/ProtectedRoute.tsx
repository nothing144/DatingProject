import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireProfileComplete?: boolean;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requireProfileComplete = true,
}) => {
  const { user, loading, isProfileComplete } = useAuth();
  const location = useLocation();

  console.log(`🛡️ ProtectedRoute Check for path ${location.pathname}:`, {
    loading,
    hasUser: !!user,
    isProfileComplete,
    requireProfileComplete
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center discover-bg relative overflow-hidden">
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
            <p className="text-white/90 font-medium">Loading your world of connections...</p>
          </div>
        </div>
      </div>
    );
  }

  // If user is not authenticated, redirect to /auth without flashing protected UI
  if (!user) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // If the route requires a completed profile and the profile is incomplete, redirect to /profile
  if (requireProfileComplete && !isProfileComplete) {
    return <Navigate to="/profile" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
