import { Request, Response, NextFunction } from 'express';
const express = require('express');
const router = express.Router();

// Use require() with corrected relative paths
const { authenticateRequest, authorizeUserAccess } = require('../auth-utils');
const { createErrorResponse, createSuccessResponse, handleSupabaseError } = require('../error-utils');
const { stripe, getOrCreateCustomerId } = require('./subscription-utils');
const { supabase } = require('../../src/lib/supabase'); // Ensure this path is correct

// POST /api/subscription/create-portal
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Authenticate the request using Express req
    // Pass the imported supabase client
    const { user, error: authError } = await authenticateRequest(req, supabase);

    if (authError || !user) {
      return res.status(401).json({ error: authError?.message || 'Unauthorized' });
    }

    // Get data from request body
    const { userId, returnUrl } = req.body;

    // Validate required parameters
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    // Authorize access - only allow users to access their own portal
    if (!authorizeUserAccess(user.id, userId)) {
      return res.status(403).json({ error: 'Forbidden: You can only access your own billing portal' });
    }

    // Get the user's Stripe customer ID
    // Pass the imported supabase client to the utility function
    const { customerId, error: customerError } = await getOrCreateCustomerId(userId, supabase); // <-- FIXED: Added supabase

    if (customerError) {
        console.error('Customer retrieval error for portal:', customerError);
        // Decide how to handle this - returning 500 might be appropriate
        return next(customerError); // Pass DB/utils errors to central handler
    }

    // Check if user has a Stripe customer ID
    if (!customerId) {
      // This shouldn't happen if getOrCreate worked, but check just in case
      console.error(`Failed to get/create Stripe customer ID for user ${userId}`);
      return res.status(500).json({ error: 'Failed to retrieve or create customer billing information.' });
    }

    // Determine the return URL
    const baseUrl = process.env.CLIENT_URL || process.env.BASE_URL; // Prioritize CLIENT_URL
    const portalReturnUrl = returnUrl || (baseUrl ? `${baseUrl}/account?tab=subscription` : undefined); // Default return to account/subscription tab

    if (!portalReturnUrl) {
        console.error('Error: Missing returnUrl for Stripe portal session and no default available', { returnUrl, baseUrl });
        return next(new Error('Server configuration error: Missing redirect URL for billing portal.'));
    }

    // Create portal session
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: portalReturnUrl,
    });

    if (!session.url) {
        console.error('Stripe portal session created without a URL', session);
        return next(new Error('Failed to create billing portal session URL'));
    }

    res.status(200).json({ url: session.url });

  } catch (error) {
    console.error('Failed to create portal session:', error);
    next(error); // Pass errors to central handler
  }
});

module.exports = router;