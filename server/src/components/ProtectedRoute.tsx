import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
// Remove Supabase import
// import { supabase } from '@/lib/supabase';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  adminRequired?: boolean;
}

export default function ProtectedRoute({ children, adminRequired = false }: ProtectedRouteProps) {
  const { user, session, isLoading, signOut } = useAuth();
  const location = useLocation();
  const [isAdminVerified, setIsAdminVerified] = useState(!adminRequired); // Assume true if admin not required
  const [isCheckingAdmin, setIsCheckingAdmin] = useState(adminRequired); // Only check if required

  useEffect(() => {
    if (!adminRequired || !user || isLoading) {
      setIsCheckingAdmin(false);
      return; // No need to check if not required, user not loaded, or auth is loading
    }

    // If adminRequired, check the user's role (e.g., via API or token claim)
    // This is a placeholder - implement actual admin check logic!
    const checkAdminStatus = async () => {
      setIsCheckingAdmin(true);
      try {
        // Example: Check a claim in the user object provided by useAuth
        // const roles = user?.app_metadata?.roles || []; 
        // setIsAdminVerified(roles.includes('admin'));
        
        // OR Example: Make an API call
        // const response = await apiClient.get('/api/user/isAdmin');
        // setIsAdminVerified(response.data.isAdmin);
        
        // Placeholder: Assume admin if email matches (adjust to your logic)
        setIsAdminVerified(user.email === 'admin@example.com'); 

      } catch (error) {
        console.error("Error verifying admin status:", error);
        setIsAdminVerified(false); // Deny access on error
      } finally {
        setIsCheckingAdmin(false);
      }
    };

    checkAdminStatus();

  }, [adminRequired, user, isLoading]);

  // --- Comment out or remove Supabase-specific session validation ---
  /*
  useEffect(() => {
    if (session) {
      // Optional: Validate session expiry locally if needed, though backend should handle it
      const tokenExpiryTime = session.expires_at ? session.expires_at * 1000 : 0;
      if (tokenExpiryTime && Date.now() > tokenExpiryTime - 60000) { // Check if expired or close to expiring
        console.log("Session expired or nearing expiry, attempting refresh or sign out...");
        // Consider triggering a refresh via your backend API or signing out
        // signOut(); // Example: Force sign out
      }
    }
  }, [session, signOut]);
  */

  // --- Loading States ---
  if (isLoading || isCheckingAdmin) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // --- Access Checks ---
  if (!user) {
    // Redirect to sign-in page, saving the intended location
    return <Navigate to="/signin" state={{ from: location }} replace />;
  }

  if (adminRequired && !isAdminVerified) {
    // Redirect to dashboard or an unauthorized page if user is not admin
    console.warn("Admin access denied for user:", user.email);
    return <Navigate to="/dashboard" replace />;
  }

  // --- Render Children --- 
  return <>{children}</>;
} 