import React, { createContext, useContext, useState, useEffect } from 'react';
// Remove Supabase-related imports
// import { supabase, secureSignIn, secureSignUp, executeQuery } from './supabase';
// import { type Session, type User } from '@supabase/supabase-js'; // Assuming these types were imported
import apiClient from './apiClient'; // Keep apiClient import

// --- Define Types (Adjust based on your actual API responses) ---
interface User {
  id: string;
  email?: string;
  // Add other relevant user fields returned by your API
  // e.g., roles, firstName, isVerified etc.
  is_email_verified?: boolean;
}

interface Session {
  access_token: string;
  // Add other relevant session fields if any (e.g., refreshToken, expiresAt)
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  isEmailVerified: boolean;
  signIn: (email?: string, password?: string, provider?: 'google' | 'github') => Promise<{ error: string | null }>;
  signUp: (email?: string, password?: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  sendVerificationEmail: () => Promise<{ error: string | null }>;
  // Add other methods if needed
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true); // Start loading until session is checked
  const [isEmailVerified, setIsEmailVerified] = useState(false);

  // --- Fetch Initial Session/User State --- 
  useEffect(() => {
    const checkUserSession = async () => {
      setIsLoading(true);
      try {
        // Attempt to get user/session info from your backend
        // This endpoint should ideally rely on a secure cookie/token
        const response = await apiClient.get('/api/auth/session'); 
        
        if (response.data && response.data.user && response.data.session) {
          setUser(response.data.user as User);
          setSession(response.data.session as Session);
          setIsEmailVerified(response.data.user.is_email_verified || false);
          // Store token if needed by apiClient interceptor
          localStorage.setItem('authSession', JSON.stringify(response.data.session));
        } else {
          // No active session
          setUser(null);
          setSession(null);
          setIsEmailVerified(false);
          localStorage.removeItem('authSession');
        }
      } catch (error) { // Handle errors (e.g., network error, server error)
        console.error("Error checking auth session:", error);
        setUser(null);
        setSession(null);
        setIsEmailVerified(false);
        localStorage.removeItem('authSession');
      } finally {
        setIsLoading(false);
      }
    };

    checkUserSession();

    // Remove Supabase auth state change listener
    /*
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      console.log("Auth state change:", _event, session);
      setSession(session);
      setUser(session?.user ?? null);
      setIsLoading(false);
      
      // Check email verification status (example - adapt as needed)
      checkEmailVerification(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
    */
  }, []); // Run only once on mount

  // --- Auth Functions (Refactored for API Client) ---

  // Example: Check email verification (Adapt based on user object)
  const checkEmailVerification = (currentUser: User | null) => {
     setIsEmailVerified(currentUser?.is_email_verified || false);
  };

  const signIn = async (email?: string, password?: string, provider?: 'google' | 'github') => {
    setIsLoading(true);
    try {
      let response;
      if (provider) {
        // Redirect to backend OAuth endpoint
        window.location.href = `/api/auth/login/${provider}`; 
        // Note: Redirect might mean the promise doesn't resolve normally here
        // State update will happen on redirect back and session check
        return { error: null }; 
      } else if (email && password) {
        // Email/Password Sign In
        response = await apiClient.post('/api/auth/login', { email, password });
      } else {
        throw new Error("Email/password or provider required for sign in.");
      }

      if (response.data && response.data.user && response.data.session) {
          setUser(response.data.user as User);
          setSession(response.data.session as Session);
          checkEmailVerification(response.data.user as User);
          localStorage.setItem('authSession', JSON.stringify(response.data.session));
          return { error: null };
      } else {
          throw new Error(response.data?.error || "Sign in failed.");
      }

    } catch (err: any) {
      console.error('Sign in error:', err);
      setUser(null);
      setSession(null);
      localStorage.removeItem('authSession');
      return { error: err.response?.data?.error || err.message || 'An unknown error occurred during sign in.' };
    } finally {
      setIsLoading(false);
    }
  };

  const signUp = async (email?: string, password?: string) => {
    setIsLoading(true);
    try {
       if (!email || !password) {
          throw new Error("Email and password are required for sign up.");
       }
       
       const response = await apiClient.post('/api/auth/register', { email, password });

       // Handle response - maybe automatically sign in, or just show success/require verification
       if (response.data?.success) { // Assuming API returns { success: true } on successful registration
           // Optionally: Sign in the user immediately or prompt for verification
           setSuccessMessage("Registration successful! Please check your email to verify your account."); // Example: Assuming a way to show messages
           return { error: null };
       } else {
           throw new Error(response.data?.error || "Sign up failed.");
       }
    } catch (err: any) {
       console.error('Sign up error:', err);
       return { error: err.response?.data?.error || err.message || 'An unknown error occurred during sign up.' };
    } finally {
       setIsLoading(false);
    }
  };

  const signOut = async () => {
    setIsLoading(true);
    try {
      await apiClient.post('/api/auth/logout'); 
    } catch (error) {
        console.error("Sign out error:", error);
        // Even if API call fails, clear local state
    } finally {
        setUser(null);
        setSession(null);
        setIsEmailVerified(false);
        localStorage.removeItem('authSession');
        setIsLoading(false);
        // Optionally redirect to home or login page
        // window.location.pathname = '/'; 
    }
  };

  const sendVerificationEmail = async () => {
     if (!user) return { error: "User not logged in" };
     
     try {
        const response = await apiClient.post('/api/auth/send-verification-email');
        if (response.data?.success) {
            return { error: null };
        } else {
            throw new Error(response.data?.error || "Failed to send verification email.");
        }
     } catch (err: any) {
        console.error('Error sending verification email:', err);
        return { error: err.response?.data?.error || err.message || 'Failed to send verification email.' };
     }
  };

  // --- Context Value ---
  const value = {
    user,
    session,
    isLoading,
    isEmailVerified,
    signIn,
    signUp,
    signOut,
    sendVerificationEmail,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// --- Hook ---
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Helper/placeholder function - remove if not used elsewhere
function setSuccessMessage(message: string) {
  console.log("Success:", message); // Replace with actual UI feedback
} 