import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback, // Added
  useMemo,    // Added
  ReactNode,
} from 'react';
import { Session, User, AuthError } from '@supabase/supabase-js';
import { supabase } from './supabase';
import apiClient from './apiClient';

// Define interfaces (keep these as they are)
export interface Profile {
  id: string;
  full_name?: string;
  nickname?: string;
  avatar_url?: string;
  avatar_color?: string; // Keep avatar_color if used
  email_preferences?: EmailPreferences | null; // Keep email_preferences if used
  // Add other profile fields as needed
}

interface EmailPreferences {
  contentUpdates: boolean;
  accountChanges: boolean;
  marketing: boolean;
}

// Define context type (keep this as it is)
type AuthContextType = {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  isLoading: boolean;
  isEmailVerified: boolean;
  isAdmin: boolean;
  isInMaintenanceMode: boolean;
  announcementBannerEnabled: boolean;
  announcementBannerText: string;
  signIn: (email: string, password: string, captchaToken?: string) => Promise<{
    error: AuthError | null;
    data: { session: Session | null; user: User | null } | null;
  }>;
  signUp: (email: string, password: string, captchaToken?: string) => Promise<{
    error: AuthError | null;
    data: { session: Session | null; user: User | null } | null;
  }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string, captchaToken?: string) => Promise<{
    error: AuthError | null;
    data: {} | null;
  }>;
  sendVerificationEmail: () => Promise<{
    error: AuthError | null;
    data: {} | null;
  }>;
  clearAuthLocally: () => void; // Keep this if used anywhere
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Login attempt logic (can be kept if desired)
const failedLoginAttempts = new Map<string, { count: number, lastAttempt: number }>();
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes

// Define the redirect URL for after the user clicks the email link in password reset
// This should match the URL used in ForgotPasswordPage.tsx and your Supabase Auth settings
const UPDATE_PASSWORD_URL = `${typeof window !== 'undefined' ? window.location.origin : ''}/update-password`;

// --- AuthProvider Component ---
export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true); // Start loading initially
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isInMaintenanceMode, setIsInMaintenanceMode] = useState(false);
  const [announcementBannerEnabled, setAnnouncementBannerEnabled] = useState(false);
  const [announcementBannerText, setAnnouncementBannerText] = useState('');

  // --- Helper Functions (Memoized with useCallback) ---

  // Renamed and updated to fetch all public config
  const fetchPublicConfig = useCallback(async (signal: AbortSignal) => {
    // console.log('🔐 [AuthProvider] Fetching public config');
    try {
      const fetchOptions: RequestInit = { signal };
      const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';
      const response = await fetch(`${baseUrl}/api/config/public`, fetchOptions);

      if (!response.ok) {
           console.warn(`⚠️ [AuthProvider] Config fetch failed: ${response.status}`);
           throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Expect the new response structure
      const data: {
        maintenanceMode: boolean;
        announcementBannerEnabled: boolean;
        announcementBannerText: string;
      } = await response.json();

      // console.log('✅ [AuthProvider] Config received:', {
      //   maintenanceMode: data?.maintenanceMode,
      //   bannerEnabled: data?.announcementBannerEnabled
      // });

      setIsInMaintenanceMode(data?.maintenanceMode ?? false);
      setAnnouncementBannerEnabled(data?.announcementBannerEnabled ?? false);
      // Only set text if banner is enabled (as per API logic)
      setAnnouncementBannerText(data?.announcementBannerText ?? '');

  } catch (err: any) {
       if (err.name === 'AbortError') {
           // Silently handle abort errors
           // console.log('🛑 [AuthProvider] Config fetch aborted');
       } else {
           console.error('❌ [AuthProvider] Failed to fetch public config:', err);
           // Set safe defaults on error
           setIsInMaintenanceMode(false);
           setAnnouncementBannerEnabled(false);
           setAnnouncementBannerText('');
       }
  }
  }, []);

  // Simplified updateAuthState - DOES NOT FETCH PROFILE HERE
  const updateAuthState = useCallback(async (newSession: Session | null) => {
    // console.log('🔐 [AuthProvider] Updating auth state, session exists:', !!newSession);
    const currentUser = newSession?.user ?? null;

    setSession(newSession);
    setUser(currentUser);
    setIsEmailVerified(currentUser?.email_confirmed_at != null);
    const adminEmail = 'enjoy@level5.life'; // Ensure this is correct
    const isAdminUser = currentUser?.email === adminEmail;
    // console.log('🔐 [AuthProvider] User email:', currentUser?.email);
    // console.log('🔐 [AuthProvider] Is admin:', isAdminUser);
    setIsAdmin(isAdminUser);
    // NOTE: We are intentionally NOT setting the profile state here.
  }, []);


  // --- Effect for Initial Load and Auth State Changes ---
  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();
    let initialAuthStateProcessed = false;

    // console.log('🔐 [AuthProvider] Setting up auth state listener');
    
    // --- Setup Auth Listener FIRST ---
    const { data: { subscription: authSubscription } } = supabase.auth.onAuthStateChange(
        async (_event, session) => {
            if (!isMounted) {
                // console.log('🛑 [AuthProvider] Component unmounted, skipping auth state processing');
                return;
            }

            // console.log(`🔐 [AuthProvider] Auth state change: ${_event}, session:`, !!session);
            
            try {
                // Update core auth state first
                await updateAuthState(session);
                
                // Then fetch public config (maintenance, banner)
                await fetchPublicConfig(controller.signal); 

            } catch (error) {
                console.error("❌ [AuthProvider] Error during auth state processing:", error);
            } finally {
                // Mark initial processing done and set loading false only after all steps
                if (!initialAuthStateProcessed) {
                    initialAuthStateProcessed = true;
                    // console.log('✅ [AuthProvider] Initial auth state processed');
                    if (isMounted) {
                        setIsLoading(false);
                    }
                } else {
                   // For subsequent changes (like logout), ensure loading remains false
                   // console.log('✅ [AuthProvider] Subsequent auth state processed');
                   if (isMounted && isLoading) { // Only set loading false if it was somehow true
                       setIsLoading(false);
                   }
                }
            }
        }
    );

    // Cleanup function
    return () => {
        // console.log('🛑 [AuthProvider] Cleaning up auth provider');
        isMounted = false;
        controller.abort();
        if (authSubscription) {
            authSubscription.unsubscribe();
        }
    };
  }, [updateAuthState, fetchPublicConfig]);


  // --- Auth Actions (Memoized with useCallback) ---
  // SignIn, SignUp, SignOut, ResetPassword, SendVerificationEmail, ClearAuthLocally remain unchanged...
  // (Code for these functions omitted for brevity, paste them back in from your original file)
   const signIn = useCallback(async (email: string, password: string, captchaToken?: string) => {
    // Lockout logic remains the same...
    const attemptInfo = failedLoginAttempts.get(email);
    const now = Date.now();
    if (attemptInfo && attemptInfo.count >= MAX_FAILED_ATTEMPTS && now - attemptInfo.lastAttempt < LOCKOUT_DURATION_MS) {
      const timeLeft = Math.ceil((LOCKOUT_DURATION_MS - (now - attemptInfo.lastAttempt)) / 60000);
      return {
        data: null,
        error: { name: 'AuthApiError', message: `Too many failed attempts. Please try again in ${timeLeft} minutes.` } as AuthError
      };
    }
    // setIsLoading(true); // Optional: Add loading state specific to sign-in action?
    try {
      // Pass captchaToken in options if it exists
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
        options: {
          ...(captchaToken && { captchaToken }),
        },
      });

      if (error) {
        // Update failed attempts count
        const currentAttempts = (failedLoginAttempts.get(email)?.count || 0) + 1;
        failedLoginAttempts.set(email, { count: currentAttempts, lastAttempt: now });
      } else {
        // Clear failed attempts on successful login
        failedLoginAttempts.delete(email);
        // updateAuthState will be triggered by onAuthStateChange listener
      }
      return { data, error };
    } catch (error) {
        console.error("Unexpected Sign In Error:", error); // Keep error log
        return { data: null, error: error instanceof AuthError ? error : new AuthError("Sign in failed unexpectedly.") };
    } finally {
      // setIsLoading(false); // Corresponding loading state set
    }
  }, []); // Empty dependency array for signIn


  const signUp = useCallback(async (email: string, password: string, captchaToken?: string) => {
    // setIsLoading(true); // Optional loading state
    try {
      // Pass captchaToken in options if it exists
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          ...(captchaToken && { captchaToken }),
          // emailRedirectTo: 'YOUR_REDIRECT_URL', // Keep if you have this for email confirmation
        },
      });
      
      // If signup was successful, sync the user with Brevo
      if (data?.user && !error) {
        try {
          // Attempt to sync the new user with Brevo using our API
          await apiClient.post('/api/user/sync-brevo', {
            email: data.user.email,
            userId: data.user.id,
            // Default preferences for new users (all enabled)
            preferences: {
              contentUpdates: true,
              accountChanges: true,
              marketing: true
            }
          });
          console.log('User synced with Brevo after signup');
        } catch (syncError) {
          // Log but don't fail signup if Brevo sync fails
          console.error('Error syncing new user with Brevo:', syncError);
        }
      }
      
      // updateAuthState will be triggered by onAuthStateChange listener if successful
      return { data, error };
    } catch (error) {
        console.error("Unexpected Sign Up Error:", error); // Keep error log
        return { data: null, error: error instanceof AuthError ? error : new AuthError("Sign up failed unexpectedly.") };
    } finally {
      // setIsLoading(false);
    }
  }, []); // Empty dependency array for signUp


  const signOut = useCallback(async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      // Clear state immediately for faster UI update
      setSession(null);
      setUser(null);
      setProfile(null);
      setIsAdmin(false);
      setIsEmailVerified(false);
      // No need to call updateAuthState(null), listener should handle if needed,
      // but direct clearing is faster for perceived logout.
      // Also clear local cache if we were using it
      failedLoginAttempts.clear(); // Clear login attempts on logout
      // console.log("User signed out.");
    } catch (error) {
      console.error('Error signing out:', error); // Keep error log
    }
  }, []); // Empty dependency array for signOut


  const resetPassword = useCallback(async (email: string, captchaToken?: string) => {
    try {
      // Pass captchaToken in options if it exists
      const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: UPDATE_PASSWORD_URL,
        ...(captchaToken && { captchaToken }),
      });
      return { data, error };
    } catch (error) {
        console.error("Unexpected Reset Password Error:", error); // Keep error log
        return { data: null, error: error instanceof AuthError ? error : new AuthError("Password reset failed unexpectedly.") };
    }
  }, []); // Empty dependency array for resetPassword


  const sendVerificationEmail = useCallback(async () => {
    // Add a check for user and user.email
    if (!user?.email) {
        console.error("Cannot send verification email: User or user email is missing."); // Keep error log
        return { data: null, error: new AuthError('User or email not available') };
    }
    try {
      // Only destructure the error, as data is likely null or {} on success
      const { error } = await supabase.auth.resend({
          type: 'signup',
          email: user.email,
          // options: { emailRedirectTo: 'YOUR_VERIFICATION_URL' } // Configure if needed
      });

      if (error) {
        // Return the actual error from Supabase
        console.error("Error resending verification email (Supabase):", error); // Keep error log
        return { data: null, error };
      } else {
        // Success: return null for data and error
        return { data: null, error: null };
      }

    } catch (err) { // Catch unexpected errors
      console.error("Unexpected Send Verification Error:", err); // Keep error log
      // Ensure we return an AuthError instance
      const authError = err instanceof AuthError ? err : new AuthError("Sending verification email failed unexpectedly.");
      return { data: null, error: authError };
    }
  }, [user]); // Dependency remains user


  // Kept this function, ensure it's used if needed or remove
  const clearAuthLocally = useCallback(() => {
    setSession(null);
    setUser(null);
    setProfile(null);
    setIsAdmin(false);
    setIsEmailVerified(false);
    failedLoginAttempts.clear();
    // Remove manual cache if used: sessionStorage.removeItem(SESSION_STORAGE_KEY);
  }, []);


  // --- Memoize the context value ---
  const value = useMemo(() => ({
    session,
    user,
    profile,
    isLoading,
    isEmailVerified,
    isAdmin,
    isInMaintenanceMode,
    announcementBannerEnabled,
    announcementBannerText,
    signIn,
    signUp,
    signOut,
    resetPassword,
    sendVerificationEmail,
    clearAuthLocally
  }), [
    session,
    user,
    profile,
    isLoading,
    isEmailVerified,
    isAdmin,
    isInMaintenanceMode,
    announcementBannerEnabled,
    announcementBannerText,
    signIn,
    signUp,
    signOut,
    resetPassword,
    sendVerificationEmail,
    clearAuthLocally
  ]);


  // --- Render Provider ---
  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// --- Custom Hook to use Auth Context ---
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}