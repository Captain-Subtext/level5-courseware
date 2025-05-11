import { Request, Response, NextFunction } from 'express';
const express = require('express');
const router = express.Router();

// Use require() with corrected relative paths
const { supabase } = require('../../src/lib/supabase'); // Path to src/lib
const { authenticateRequest, authorizeUserAccess } = require('../auth-utils');
const { handleSupabaseError, createErrorResponse, createSuccessResponse } = require('../error-utils');

// GET /api/subscription/get-details
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Authenticate the request using Express req
    // NOTE: authenticateRequest may need adaptation for Express req object
    const { user, error: authError } = await authenticateRequest(req);
    
    if (authError || !user) {
      // Assuming createErrorResponse works or adapt to res.status().json()
      return res.status(401).json({ error: authError?.message || 'Unauthorized' });
    }
    
    // Get the requested userId from the query parameters
    const requestedUserId = req.query.userId as string;

    if (!requestedUserId) {
      return res.status(400).json({ error: 'User ID is required' });
    }
    
    // Authorize access to this user's data
    // NOTE: authorizeUserAccess might need adaptation if it expects specific request structure
    if (!authorizeUserAccess(user.id, requestedUserId)) {
      return res.status(403).json({ error: 'Forbidden: You can only access your own subscription data' });
    }

    // Query user's subscription directly from Supabase
    const { data, error } = await supabase
      .from('subscriptions')
      .select('*, plan:plans(*)')
      .eq('user_id', requestedUserId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      // If no subscription found, return null (not an error)
      if (error.code === 'PGRST116') {
        // Assuming createSuccessResponse works or adapt to res.status().json()
        return res.status(200).json({ subscription: null });
      }

      console.error('Error fetching subscription:', error);
      // Pass DB errors to the central handler
      return next(error); 
    }

    // Assuming createSuccessResponse works or adapt to res.status().json()
    res.status(200).json({ subscription: data });

  } catch (error) {
    console.error('Failed to get subscription details:', error);
    // Pass unexpected errors to the central handler
    next(error); 
  }
});

module.exports = router; 