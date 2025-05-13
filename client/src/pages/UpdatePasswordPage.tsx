import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useNavigate, useLocation } from 'react-router-dom';
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, CheckCircle2 } from 'lucide-react';

export default function UpdatePasswordPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [errorFromUrl, setErrorFromUrl] = useState<string | null>(null);

  useEffect(() => {
    // Set document title
    document.title = "Update Password | Cursor for Non-Coders";
    // Log the URL hash immediately on mount
    console.log(`[UpdatePasswordPage] Initial location hash: ${location.hash}`);

    // Supabase specific handling for password recovery hash
    // It automatically handles the access_token from the URL fragment
    // and sets the session when the component mounts if the token is valid.
    // We just need to check for errors passed in the URL query params by Supabase.
    const params = new URLSearchParams(location.search);
    const errorDescription = params.get('error_description');
    if (errorDescription) {
        console.error(`[UpdatePasswordPage] Error from URL params: ${errorDescription}`);
        setErrorFromUrl(errorDescription);
        setMessage({ type: 'error', text: `Error processing reset link: ${errorDescription}. Please request a new link.` });
    }

    // Listen for auth state changes to confirm session is set after recovery
    console.log('[UpdatePasswordPage] Setting up onAuthStateChange listener.');
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
        console.log(`[UpdatePasswordPage] onAuthStateChange Event: ${event}`);
        if (event === 'PASSWORD_RECOVERY') {
            console.log('%c[UpdatePasswordPage] PASSWORD_RECOVERY event detected. Session should be set.', 'color: #22C55E;', session);
            // Session should now be set by supabase-js, allowing updateUser call
            // Clear any URL error message now that we likely have a session
            setErrorFromUrl(null);
            if(message?.text.startsWith('Error processing reset link')) setMessage(null); 
        } else if (event === 'SIGNED_IN') {
             console.log('[UpdatePasswordPage] SIGNED_IN event detected (unexpected here, but logging). Session:', session);
        } else if (event === 'INITIAL_SESSION') {
             console.log('[UpdatePasswordPage] INITIAL_SESSION event detected. Session:', session);
             // Check if this initial session is from the recovery flow (less reliable than PASSWORD_RECOVERY event)
        }
    });

    // Cleanup the listener on component unmount
    return () => {
        console.log('[UpdatePasswordPage] Cleaning up onAuthStateChange listener.');
        subscription?.unsubscribe();
    };
  }, [location.search]); // Dependency array remains the same

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      setMessage({ type: 'error', text: "Passwords do not match." });
      return;
    }
    
    if (password.length < 8) {
      setMessage({ type: 'error', text: "Password must be at least 8 characters long." });
      return;
    }

    setLoading(true);
    setMessage(null); 
    setErrorFromUrl(null);

    try {
      const { data: _data, error } = await supabase.auth.updateUser({
        password: password,
      });

      setLoading(false);

      if (error) {
        console.error("[UpdatePasswordPage] Error updating password:", error); // Detailed log for developers
        
        let userFriendlyMessage = "An unexpected error occurred while updating your password. Please try again or contact support.";
        
        // Example of mapping specific Supabase error messages
        if (error.message.includes("Password should be at least 6 characters")) {
          userFriendlyMessage = "Password is too short. It must be at least 8 characters long.";
        } else if (error.message.toLowerCase().includes("new password should be different")) {
          userFriendlyMessage = "Your new password must be different from your old password.";
        } else if (error.message.toLowerCase().includes("user not found")) {
          userFriendlyMessage = "Could not update password. User session may have expired. Please try requesting a new password reset link.";
        }

        setMessage({ type: 'error', text: userFriendlyMessage });
      } else {
        // 'data' from supabase.auth.updateUser is not used, prefix with _data if necessary based on lint rules, but here we just don't use it.
        // Success: Navigate to sign-in page with a success message
        setPassword('');
        setConfirmPassword('');
        // No need to set local message here as we are navigating
        navigate('/signin', { 
          replace: true, 
          state: { message: "Password updated successfully! You can now sign in." } 
        });
      }
    } catch (err) {
      // Catch any other unexpected errors during the async operation (e.g., network issues not caught by Supabase client)
      setLoading(false);
      console.error("[UpdatePasswordPage] Unexpected exception during password update:", err);
      setMessage({ type: 'error', text: "An unexpected error occurred. Please check your connection and try again." });
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Navbar />
      <main className="flex-grow flex items-center justify-center bg-muted/40 px-4 py-12">
        <Card className="w-full max-w-sm">
          <CardHeader>
            <CardTitle className="text-2xl">Update Password</CardTitle>
            <CardDescription>
              Enter your new password below.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Show initial error from URL parsing if present */} 
            {errorFromUrl && !message && (
               <Alert variant="destructive" className="mb-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{`Error processing reset link: ${errorFromUrl}. Please request a new link.`}</AlertDescription>
                </Alert>
            )}
  
            <form onSubmit={handlePasswordUpdate} className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="password">New Password</Label>
                <Input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading || !!errorFromUrl} // Disable if initial URL processing failed
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="confirm-password">Confirm New Password</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={loading || !!errorFromUrl}
                />
              </div>
  
              {/* Show success/error messages from form submission */} 
              {message && (
                <Alert variant={message.type === 'error' ? 'destructive' : 'default'}>
                  {message.type === 'error' ? <AlertCircle className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
                  <AlertTitle>{message.type === 'error' ? 'Error' : 'Success'}</AlertTitle>
                  <AlertDescription>{message.text}</AlertDescription>
                </Alert>
              )}
  
              <Button type="submit" className="w-full" disabled={loading || !!errorFromUrl}>
                {loading ? 'Updating...' : 'Update Password'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
} 