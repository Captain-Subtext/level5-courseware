import { createClient } from '@supabase/supabase-js'

// Get Supabase URL and Anon Key from environment variables
// Ensure these are prefixed with VITE_ in your .env file
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Basic error handling for missing environment variables
if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Supabase URL (VITE_SUPABASE_URL) or Anon Key (VITE_SUPABASE_ANON_KEY) is missing.")
  throw new Error("Supabase configuration is missing from client environment variables. Did you create a .env file in the 'client' directory and prefix the variables with VITE_?")
}

// Define Supabase client options
const options = {
  auth: {
    // autoRefreshToken: true, // default
    // persistSession: true, // default
    detectSessionInUrl: true, // CHANGE TO true to handle OAuth callback params
    flowType: 'pkce' as const, // Recommended for client-side
  },
  global: {
    // headers: { 'x-my-custom-header': 'cursor-learning-client' }, // Example global header
  },
};

// Create and export the Supabase client instance for client-side usage
// Uses ANON_KEY for client-side operations
export const supabase = createClient(supabaseUrl, supabaseAnonKey, options)

// Note: Utility functions like executeQuery, secureSignIn, etc., 
// were present in the server-side version of this file but are generally 
// not needed directly in the client-side Supabase setup file.
// Authentication and data fetching logic should reside in appropriate client modules/hooks (e.g., auth.tsx, api.ts).
