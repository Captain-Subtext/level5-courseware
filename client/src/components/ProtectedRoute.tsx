import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: string;
}

export default function ProtectedRoute({ 
  children, 
  requiredRole
}: ProtectedRouteProps) {
  const { user, session, isLoading } = useAuth();
  const location = useLocation(); // Keep location for redirect state
  // Removed navigate and security checking state/logic as it's implicitly handled

  // 1. Handle Loading State
  if (isLoading) {
    // console.log('[ProtectedRoute] Auth loading...');
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-muted-foreground">Loading...</span>
      </div>
    );
  }

  // ADD LOGGING HERE FOR PRODUCTION DEBUGGING
  // console.log('[ProtectedRoute Prod Debug] isLoading:', isLoading, 'Has User:', !!user, 'Has Session:', !!session, 'Path:', location.pathname);

  // 2. Handle Not Authenticated State (after loading is complete)
  if (!user || !session) {
    // console.log('[ProtectedRoute] No user/session after load, redirecting to signin.');
    // console.log('[ProtectedRoute Prod Debug] Condition PASSED - Redirecting to signin.'); // Log when redirect happens
    // Redirect to signin, passing the current location to redirect back later
    return <Navigate to="/signin" state={{ from: location }} replace />;
  }

  // 3. Handle Role Check (if applicable and user is authenticated)
  // Note: This basic example doesn't include role checking from the original
  // Add back role checking logic here if needed, potentially fetching the profile.
  // Be mindful of adding another loading state if fetching profile for role check.
  if (requiredRole) {
    // Placeholder: Add role checking logic here
    // console.warn('[ProtectedRoute] Role checking not fully implemented in this version.');
    // Example (requires fetching profile):
    // const profile = fetchUserProfile(); // Needs implementation
    // if (loadingProfile) return <LoadingSpinner />;
    // if (profile?.role !== requiredRole) return <Navigate to="/unauthorized" replace />;
  }

  // 4. Render Children (if loading is done and user is authenticated)
  // console.log('[ProtectedRoute] User authenticated, rendering children.');
  return <>{children}</>;
} 