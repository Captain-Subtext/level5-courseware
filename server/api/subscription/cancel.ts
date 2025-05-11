import { Request, Response, NextFunction } from 'express';
const express = require('express');
const router = express.Router();

// Use require() with corrected relative paths
const { supabase } = require('../../src/lib/supabase'); 
const { authenticateRequest } = require('../auth-utils');
const { createErrorResponse, createSuccessResponse, handleSupabaseError } = require('../error-utils');
const { stripe, getSubscriptionById } = require('./subscription-utils');

// POST /api/subscription/cancel
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Authenticate the request using Express req
    // NOTE: authenticateRequest may need adaptation
    const { user, error: authError } = await authenticateRequest(req);
    
    if (authError || !user) {
      return res.status(401).json({ error: authError?.message || 'Unauthorized' });
    }
    
    // Get subscriptionId from request body
    const { subscriptionId } = req.body;

    // Validate required parameters
    if (!subscriptionId) {
      return res.status(400).json({ error: 'Subscription ID is required' });
    }
    
    // Verify this subscription belongs to the authenticated user
    // NOTE: getSubscriptionById might need adaptation
    const { data: subscription, error: subError } = await getSubscriptionById(subscriptionId);
      
    if (subError || !subscription) {
        // Pass potential DB error to central handler, or handle 404
        if (subError?.code === 'PGRST116' || !subscription) {
            return res.status(404).json({ error: 'Subscription not found' });
        }
        console.error('Error fetching subscription for cancellation:', subError);
        return next(subError); 
    }
    
    // Check if user owns this subscription
    if (subscription.user_id !== user.id) {
      return res.status(403).json({ error: 'Forbidden: You can only cancel your own subscriptions' });
    }

    // Cancel the subscription in Stripe (at period end)
    const subscriptionUpdate = await stripe.subscriptions.update(subscription.stripe_subscription_id, { // Use ID from DB object
      cancel_at_period_end: true,
    });

    // Update subscription status in Supabase
    const { error: updateError } = await supabase
      .from('subscriptions')
      .update({ 
        status: 'cancel_pending', // Or map Stripe status?
        cancel_at: subscriptionUpdate.cancel_at ? new Date(subscriptionUpdate.cancel_at * 1000).toISOString() : null,
        updated_at: new Date().toISOString()
      })
      .eq('stripe_subscription_id', subscription.stripe_subscription_id); // Use ID from DB object

    if (updateError) {
      // Log error but don't fail the request since Stripe cancellation succeeded
      console.error("Error updating subscription status in database after Stripe cancellation:", updateError);
    }

    res.status(200).json({ 
      success: true,
      status: subscriptionUpdate.status,
      cancel_at: subscriptionUpdate.cancel_at ? new Date(subscriptionUpdate.cancel_at * 1000).toISOString() : null
    });

  } catch (error) {
    console.error('Failed to cancel subscription:', error);
    next(error); // Pass errors to central handler
  }
});

module.exports = router; 