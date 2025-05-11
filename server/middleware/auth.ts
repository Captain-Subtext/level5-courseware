import { Request, Response, NextFunction } from 'express';
// Adjust path based on your structure
const { supabase } = require('../src/lib/supabase'); 

// Extend the Express Request interface to include the user property
declare global {
  namespace Express {
    interface Request {
      user?: { id: string; email?: string | undefined; } | undefined;
    }
  }
}

/**
 * Express middleware to verify Supabase JWT token.
 * Extracts token from Authorization header, verifies it with Supabase,
 * and attaches the user object to req.user if valid.
 */
async function isAuthenticated(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.warn('Auth: Missing or invalid Authorization header.');
    return res.status(401).json({ error: 'Missing or invalid authorization token' });
  }

  const token = authHeader.split(' ')[1];

  if (!token) {
    console.warn('Auth: Token not found after Bearer.');
    return res.status(401).json({ error: 'Missing authorization token' });
  }

  try {
    // Verify the token using Supabase
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error) {
      console.warn('Auth: Supabase token verification failed:', error.message);
      // Differentiate between expired token and other errors if needed
      if (error.message.includes('expired')) {
        return res.status(401).json({ error: 'Authorization token expired' });
      }  
      return res.status(401).json({ error: 'Invalid authorization token' });
    }

    if (!user) {
      console.warn('Auth: No user found for valid token.');
      return res.status(401).json({ error: 'User not found for provided token' });
    }

    // Attach user to request object
    req.user = user;
    // console.log(`Auth: User ${user.id} authenticated for ${req.method} ${req.originalUrl}`); // Commented out success log
    next(); // Proceed to the next middleware/route handler

  } catch (err) {
    console.error('Auth: Unexpected error during token verification:', err);
    // Pass unexpected errors to the central error handler
    next(err);
  }
}

module.exports = { isAuthenticated }; 