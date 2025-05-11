// Import Express types if needed for internal use, though not strictly required for export
// import { Request } from 'express'; 
import { SupabaseClient } from '@supabase/supabase-js'; // Import type for parameter

// Use require()
// const { supabase } = require('../src/lib/supabase'); // REMOVED: Import will happen in route handlers

/**
 * Verifies a user is authenticated and returns the user object (for Express)
 * Accepts supabase client as a parameter
 */
async function authenticateRequest(req: any, supabase: SupabaseClient) { // Added supabase parameter
  try {
    // Get the authorization header from Express req
    const authHeader = req.headers['authorization'];
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // Return an error object compatible with how it's used upstream
      return { user: null, error: { message: 'Missing or invalid authorization header' } };
    }
    
    const token = authHeader.split(' ')[1];
    
    if (!token) {
      return { user: null, error: { message: 'Missing token' } };
    }
    
    // Verify the token with Supabase
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      // Return Supabase error or generic one
      return { user: null, error: error || { message: 'Invalid token' } };
    }
    
    // Success
    return { user, error: null };

  } catch (error) {
    console.error('Authentication error:', error);
    return { user: null, error: { message: 'Authentication failed' } };
  }
}

/**
 * Verifies the requesting user is allowed to access the requested user data
 */
function authorizeUserAccess(requestingUserId: string, requestedUserId: string): boolean {
  // Logic remains the same
  return requestingUserId === requestedUserId;
}

// Export functions
module.exports = {
  authenticateRequest,
  authorizeUserAccess,
}; 