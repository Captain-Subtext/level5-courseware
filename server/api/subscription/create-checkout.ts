import { Request, Response, NextFunction } from 'express';
const express = require('express');
const router = express.Router();

// Import Supabase client *here* instead of utils
const { supabase } = require('../../src/lib/supabase');

// Use require() with corrected relative paths
// Import only the exported function from error-utils
const { handleSupabaseError } = require('../error-utils');
// Import utils (they no longer import supabase themselves)
const { stripe, getPlanById, getOrCreateCustomerId } = require('./subscription-utils');
// Import the shared authentication middleware
const { isAuthenticated } = require('../../middleware/auth');

// POST /api/subscription/create-checkout
// Apply authentication middleware directly to the route
router.post('/', isAuthenticated, async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Get authenticated user ID from middleware
    const userId = req.user?.id;
    if (!userId) {
      // This should ideally not happen if isAuthenticated works correctly
      // Use the imported error handler
      return res.status(401).json(handleSupabaseError(new Error('User not authenticated'), 'Authentication Failed'));
    }

    // Get planType from request body (changed from planId)
    const { planType, returnUrl } = req.body;

    // Validate required parameters
    if (!planType || typeof planType !== 'string') {
      // Use the imported error handler
      return res.status(400).json(handleSupabaseError(new Error('planType (string) is required'), 'Bad Request'));
    }

    // Fetch plan details using planType (e.g., 'monthly', 'annual')
    // getPlanById should handle finding by type
    // Pass supabase client to the utility function
    const { data: plan, error: planError } = await getPlanById(planType, supabase);

    if (planError || !plan || !plan.stripe_price_id) {
      console.error(`Failed to find active plan or stripe_price_id for type: ${planType}`, planError);
      // Use the imported error handler
      return res.status(404).json(handleSupabaseError(planError || new Error(`Plan type '${planType}' not found or missing Stripe Price ID`), 'Plan Not Found'));
    }

    // Get or create Stripe customer ID for the authenticated user
    // Pass supabase client to the utility function
    const { customerId, error: customerError } = await getOrCreateCustomerId(userId, supabase);

    if (customerError || !customerId) {
        console.error(`Error getting/creating Stripe customer for user ${userId}:`, customerError);
        // Use handleSupabaseError for consistency, even if it's not a direct DB error
        return res.status(500).json(handleSupabaseError(customerError || new Error('Failed to retrieve or create customer ID'), 'Customer ID Error'));
    }

    // Determine success/cancel URLs
    // Use environment variables for base URL, fallback carefully
    const baseUrl = process.env.FRONTEND_URL || process.env.BASE_URL; // Prioritize explicit FRONTEND_URL
    if (!baseUrl) {
      console.warn('Warning: FRONTEND_URL/BASE_URL not set for checkout redirects.');
      // Avoid using req.origin as it might be the API URL, not the frontend
    }
    const success_url = returnUrl?.success || (baseUrl ? `${baseUrl}/account?tab=subscription&checkout=success` : undefined);
    const cancel_url = returnUrl?.cancel || (baseUrl ? `${baseUrl}/account?tab=subscription&checkout=cancelled` : undefined);
    
    if (!success_url || !cancel_url) {
        console.error('Error: Missing success_url or cancel_url for Stripe checkout', { returnUrl, baseUrl });
        return next(new Error('Server configuration error: Missing redirect URLs for checkout.'));
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price: plan.stripe_price_id, // Use the looked-up stripe_price_id
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: success_url, 
      cancel_url: cancel_url,
      metadata: {
        userId: userId, // Use authenticated userId
        planId: plan.id // Store the internal plan UUID
      }
    });

    if (!session.url) {
      console.error('Stripe session created without a URL', session);
      return next(new Error('Failed to create checkout session URL'));
    }

    res.status(200).json({ sessionId: session.id }); // Return sessionId as expected by client

  } catch (error) {
    console.error('Failed to create checkout session:', error);
    next(error); // Pass errors to central handler
  }
});

module.exports = router; 