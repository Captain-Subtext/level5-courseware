import { Request, Response, NextFunction } from 'express';
import Stripe from 'stripe'; // <--- Make sure this import is present
import { SupabaseClient } from '@supabase/supabase-js'; // <--- Make sure this import is present
const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const { supabase } = require('../../src/lib/supabase');
const { getSubscriptionById, getPlanById, getOrCreateCustomerId } = require('../subscription/subscription-utils');

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', { // <--- Make sure this block is present
  apiVersion: '2025-03-31.basil',
  typescript: true,
});

/**
 * Webhook endpoint for handling Stripe events
 */
router.post('/', async (req: Request, res: Response) => {
  // Use rawBody attached by middleware in server.ts
  const payload = (req as any).rawBody;
  const signature = req.headers['stripe-signature'] as string;

  if (!payload) {
    console.error('Stripe Webhook Error: Missing raw body');
    return res.status(400).send('Webhook Error: Missing raw body');
  }
  if (!signature) {
    console.error('Stripe Webhook Error: Missing signature');
    return res.status(400).send('Webhook Error: Missing signature');
  }

  let event: Stripe.Event;
  try {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || '';
    if (!webhookSecret) {
        console.error('Stripe Webhook Error: Missing STRIPE_WEBHOOK_SECRET');
        return res.status(500).send('Server configuration error');
    }
    // Verify the webhook signature using the raw body
    event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);
  } catch (error: any) {
    console.error('Webhook signature verification failed:', error.message);
    return res.status(400).send(`Webhook Error: ${error.message}`);
  }

  // Handle the event
  try {
    console.log(`Stripe Event Received: ${event.type}`); // Log received event type
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session, supabase);
        break;
      case 'customer.subscription.created': // Often handled by checkout.session.completed
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription, supabase);
        break;
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription, supabase);
        break;
      case 'invoice.payment_succeeded':
        await handleInvoicePaymentSucceeded(event.data.object as Stripe.Invoice, supabase);
        break;
      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice, supabase);
        break;
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    // Return a success response to Stripe
    res.status(200).json({ received: true });

  } catch (error) {
    // Catch errors within the event handling logic
    console.error(`Error handling Stripe event ${event.type}:`, error);
    // Still return 200 to Stripe to acknowledge receipt, but log the error
    res.status(200).json({ received: true, error: 'Internal handler error' });
  }
});

module.exports = router;

/**
 * Handle checkout.session.completed event
 */
async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session, supabase: SupabaseClient) {
  console.log('[handleCheckoutSessionCompleted] Starting processing for session:', session.id);

  const userId = session.metadata?.userId;
  const planIdMetadata = session.metadata?.planId;
  const subscriptionId = session.subscription;

  if (!userId || !planIdMetadata || !subscriptionId) {
    console.error(`[handleCheckoutSessionCompleted] Missing required data: userId=${userId}, planIdMetadata=${planIdMetadata}, subscriptionId=${subscriptionId} for session ${session.id}`);
    return;
  }
  console.log(`[handleCheckoutSessionCompleted] Extracted Data: userId=${userId}, planIdMetadata=${planIdMetadata}, subscriptionId=${subscriptionId}`);

  try {
    let planId = planIdMetadata; // Use metadata planId initially
    console.log('[handleCheckoutSessionCompleted] Original planId from metadata:', planId);

    // Check if it's a plan_type identifier (not a UUID)
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(planId);

    if (!isUuid) {
      console.log('[handleCheckoutSessionCompleted] Plan ID is not a UUID, looking up plan by type:', planId);
      // Look up the actual plan ID by plan_type
      const { data: plan, error: planError } = await supabase
        .from('plans')
        .select('id')
        .eq('plan_type', planId) // Assuming 'plan_type' is the column name for 'free' or 'premium'
        .eq('active', true)
        .single();

      if (planError || !plan) {
        console.error(`[handleCheckoutSessionCompleted] Error looking up plan ID for type '${planId}':`, planError);
        // If lookup fails, log error but continue with the original planId as a fallback? Or should we return?
        // For now, continuing with original planIdMetadata, adjust if needed.
        console.warn(`[handleCheckoutSessionCompleted] Could not find active plan ID for type '${planId}'. Check 'plans' table. Continuing with original identifier as fallback.`);
      } else {
        planId = plan.id; // Use the UUID found in the database
        console.log('[handleCheckoutSessionCompleted] Found plan in DB with ID:', planId);
      }
    }
    console.log('[handleCheckoutSessionCompleted] Using final planId:', planId);

    // Fetch the subscription details from Stripe
    console.log('[handleCheckoutSessionCompleted] Fetching subscription details from Stripe:', subscriptionId as string);
    const subscriptionData = await stripe.subscriptions.retrieve(subscriptionId as string);
    console.log('[handleCheckoutSessionCompleted] Successfully fetched subscription from Stripe:', subscriptionData.id, 'Status:', subscriptionData.status);

    // --- UPDATED: Improved period date extraction from subscription items ---
    // Dates are nested within the first subscription item in the retrieved object
    let safePeriodStart: string;
    let safePeriodEnd: string;

    // First try to get period dates from the subscription items (modern Stripe API structure)
    const firstItem = subscriptionData.items?.data?.[0];
    if (firstItem) {
      const periodStartTimestamp = (firstItem as any).current_period_start;
      const periodEndTimestamp = (firstItem as any).current_period_end;

      if (periodStartTimestamp && typeof periodStartTimestamp === 'number') {
        safePeriodStart = new Date(periodStartTimestamp * 1000).toISOString();
      } else {
        // Fall back to top-level properties
        const topLevelPeriodStart = (subscriptionData as any).current_period_start;
        if (topLevelPeriodStart && typeof topLevelPeriodStart === 'number') {
          safePeriodStart = new Date(topLevelPeriodStart * 1000).toISOString();
        } else {
          console.warn(`[handleCheckoutSessionCompleted] Invalid current_period_start (${periodStartTimestamp}) from Stripe for sub ${subscriptionData.id}. Defaulting to now.`);
          safePeriodStart = new Date().toISOString();
        }
      }

      if (periodEndTimestamp && typeof periodEndTimestamp === 'number') {
        safePeriodEnd = new Date(periodEndTimestamp * 1000).toISOString();
      } else {
        // Fall back to top-level properties
        const topLevelPeriodEnd = (subscriptionData as any).current_period_end;
        if (topLevelPeriodEnd && typeof topLevelPeriodEnd === 'number') {
          safePeriodEnd = new Date(topLevelPeriodEnd * 1000).toISOString();
        } else {
          console.warn(`[handleCheckoutSessionCompleted] Invalid current_period_end (${periodEndTimestamp}) from Stripe for sub ${subscriptionData.id}. Defaulting to now.`);
          safePeriodEnd = new Date().toISOString();
        }
      }
    } else {
      // No items found, try top-level properties as fallback
      const topLevelPeriodStart = (subscriptionData as any).current_period_start;
      const topLevelPeriodEnd = (subscriptionData as any).current_period_end;

      if (topLevelPeriodStart && typeof topLevelPeriodStart === 'number') {
        safePeriodStart = new Date(topLevelPeriodStart * 1000).toISOString();
      } else {
        console.warn(`[handleCheckoutSessionCompleted] Invalid current_period_start (${topLevelPeriodStart}) from Stripe for sub ${subscriptionData.id}. Defaulting to now.`);
        safePeriodStart = new Date().toISOString();
      }

      if (topLevelPeriodEnd && typeof topLevelPeriodEnd === 'number') {
        safePeriodEnd = new Date(topLevelPeriodEnd * 1000).toISOString();
      } else {
        console.warn(`[handleCheckoutSessionCompleted] Invalid current_period_end (${topLevelPeriodEnd}) from Stripe for sub ${subscriptionData.id}. Defaulting to now.`);
        safePeriodEnd = new Date().toISOString();
      }
    }
    // --- End of updated period date extraction ---

    // Prepare the subscription data
    const subscriptionRecord = {
      id: subscriptionData.id,
      user_id: userId,
      stripe_customer_id: session.customer as string,
      plan_id: planId, // Use the potentially looked-up UUID
      status: subscriptionData.status,
      current_period_start: safePeriodStart, // Use safe value
      current_period_end: safePeriodEnd,     // Use safe value
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      // Add any other relevant fields from subscriptionData if needed
    };
    console.log('[handleCheckoutSessionCompleted] Subscription Data:', subscriptionRecord);

    // UPDATED: First check if the user already has a subscription record
    console.log(`[handleCheckoutSessionCompleted] Checking if user ${userId} already has a subscription record`);
    const { data: existingSubscription, error: fetchError } = await supabase
      .from('subscriptions')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle();

    if (fetchError) {
      console.error(`[handleCheckoutSessionCompleted] Error checking for existing subscription:`, fetchError);
      // Continue with attempt to create new subscription
    }

    let error;
    if (existingSubscription) {
      // User has an existing subscription record, update it
      console.log(`[handleCheckoutSessionCompleted] User ${userId} has existing subscription record. Updating with new subscription data.`);
      const { error: updateError } = await supabase
        .from('subscriptions')
        .update(subscriptionRecord)
        .eq('user_id', userId);
      
      error = updateError;
    } else {
      // No existing subscription for this user, create a new one
      console.log(`[handleCheckoutSessionCompleted] No existing subscription found for user ${userId}. Creating new record.`);
      const { error: insertError } = await supabase
        .from('subscriptions')
        .insert(subscriptionRecord);
      
      error = insertError;
    }

    if (error) {
      console.error('[handleCheckoutSessionCompleted] Error saving subscription to database:', error);
      // Optionally throw error here if needed, depends on desired handling
    } else {
      console.log('[handleCheckoutSessionCompleted] Successfully saved subscription for user:', userId);
    }

    console.log('[handleCheckoutSessionCompleted] Finished processing session:', session.id);

  } catch (error) {
    console.error('[handleCheckoutSessionCompleted] Error processing checkout session:', error);
  }
}

/**
 * Handle customer.subscription.updated event
 */
async function handleSubscriptionUpdated(subscriptionEventData: Stripe.Subscription, supabase: SupabaseClient) {
  console.log(`[handleSubscriptionUpdated] Processing update for Stripe subscription ID: ${subscriptionEventData.id}`);

  try {
    // Fetch the latest full subscription details directly from Stripe
    // This ensures we have the most accurate and complete data, regardless of minor payload variations in the event.
    console.log(`[handleSubscriptionUpdated] Fetching latest subscription details from Stripe: ${subscriptionEventData.id}`);
    const stripeSubscription: Stripe.Subscription = await stripe.subscriptions.retrieve(subscriptionEventData.id);
    console.log(`[handleSubscriptionUpdated] Successfully fetched subscription from Stripe. Status: ${stripeSubscription.status}`);

    // Find the corresponding subscription in our database using the ID (which is our PK)
    console.log(`[handleSubscriptionUpdated] Looking for existing subscription record in DB with ID: ${stripeSubscription.id}`);
    const { data: existingSubscription, error: fetchError } = await supabase
      .from('subscriptions')
      .select('id') // Only need to select 'id' to confirm existence
      .eq('id', stripeSubscription.id)
      .maybeSingle(); // Use maybeSingle as it might be the creation event before checkout handler finishes

    if (fetchError) {
      console.error(`[handleSubscriptionUpdated] Error fetching subscription from DB using ID ${stripeSubscription.id}:`, fetchError);
      // Throw the error to be caught by the main handler, ensuring Stripe retries if needed
      throw fetchError;
    }

    if (!existingSubscription) {
      // This could happen if customer.subscription.updated/created arrives before checkout.session.completed finishes DB write.
      console.warn(`[handleSubscriptionUpdated] Subscription ${stripeSubscription.id} not found in database. This might be okay if checkout.session.completed handles creation/initial update.`);
      // Depending on business logic, you might want to insert here, but typically checkout handler owns creation.
      // For now, we'll just return, assuming another handler will manage it.
      return;
    }
    console.log(`[handleSubscriptionUpdated] Found existing subscription record ${existingSubscription.id}. Preparing update...`);

    // --- Start: Safe Date Handling for update (using fetched Stripe data) ---
    // Dates are nested within the first subscription item in the retrieved object
    const firstItem = stripeSubscription.items?.data?.[0];
    if (!firstItem) {
        console.error(`[handleSubscriptionUpdated] Could not find subscription item data in retrieved Stripe subscription ${stripeSubscription.id}. Cannot update period dates.`);
        // Decide if we should throw an error or try to update only status etc.
        // For now, let's throw to indicate a problem.
        throw new Error(`Subscription item data missing for ${stripeSubscription.id}`);
    }

    // Use type assertion (as any) for properties within the item, if needed by TS/linter
    const periodStartTimestamp = (firstItem as any).current_period_start;
    const periodEndTimestamp = (firstItem as any).current_period_end;
    const canceledAtTimestamp = stripeSubscription.canceled_at;
    const endedAtTimestamp = stripeSubscription.ended_at;

    let safePeriodStart = new Date().toISOString(); // Default
    if (periodStartTimestamp && typeof periodStartTimestamp === 'number') {
        safePeriodStart = new Date(periodStartTimestamp * 1000).toISOString();
    } else {
        console.warn(`[handleSubscriptionUpdated] Invalid/missing current_period_start (${periodStartTimestamp}) from Stripe API for sub ${stripeSubscription.id}. Defaulting to now.`);
    }

    let safePeriodEnd = new Date().toISOString(); // Default
    if (periodEndTimestamp && typeof periodEndTimestamp === 'number') {
        safePeriodEnd = new Date(periodEndTimestamp * 1000).toISOString();
    } else {
        console.warn(`[handleSubscriptionUpdated] Invalid/missing current_period_end (${periodEndTimestamp}) from Stripe API for sub ${stripeSubscription.id}. Defaulting to now.`);
    }

    let safeCanceledAt = null;
    if (canceledAtTimestamp && typeof canceledAtTimestamp === 'number') {
        if (!isNaN(new Date(canceledAtTimestamp * 1000).getTime())) {
            safeCanceledAt = new Date(canceledAtTimestamp * 1000).toISOString();
        } else {
            console.warn(`[handleSubscriptionUpdated] Invalid canceled_at timestamp (${canceledAtTimestamp}) from Stripe API for sub ${stripeSubscription.id}. Setting to null.`);
        }
    }

    let safeEndedAt = null;
    if (endedAtTimestamp && typeof endedAtTimestamp === 'number') {
        if (!isNaN(new Date(endedAtTimestamp * 1000).getTime())) {
            safeEndedAt = new Date(endedAtTimestamp * 1000).toISOString();
        } else {
            console.warn(`[handleSubscriptionUpdated] Invalid ended_at timestamp (${endedAtTimestamp}) from Stripe API for sub ${stripeSubscription.id}. Setting to null.`);
        }
    }
    // --- End: Safe Date Handling ---

    // Prepare data for update
    const updateData = {
      status: stripeSubscription.status,
      current_period_start: safePeriodStart,
      current_period_end: safePeriodEnd,
      canceled_at: safeCanceledAt,
      ended_at: safeEndedAt,
      cancel_at_period_end: stripeSubscription.cancel_at_period_end,
      updated_at: new Date().toISOString(),
      // Include other potentially relevant fields from stripeSubscription if needed
      // e.g., plan_id, stripe_customer_id - though these rarely change on update
    };
    console.log('[handleSubscriptionUpdated] Update Data:', updateData);

    // Update the subscription in the database using the primary key 'id'
    const { error: updateError } = await supabase
      .from('subscriptions')
      .update(updateData)
      .eq('id', existingSubscription.id); // Use the primary key 'id'

    if (updateError) {
      console.error(`[handleSubscriptionUpdated] Error updating subscription ${existingSubscription.id} in database:`, updateError);
      // Throw the error to be caught by the main handler
      throw updateError;
    } else {
      console.log(`[handleSubscriptionUpdated] Successfully updated subscription ${existingSubscription.id}.`);
    }

  } catch (error) {
      console.error(`[handleSubscriptionUpdated] Overall error processing subscription ${subscriptionEventData.id}:`, error);
      // Re-throw the error so the main handler catches it and Stripe knows processing failed
      throw error;
  }
}

/**
 * Handle customer.subscription.deleted event
 */
async function handleSubscriptionDeleted(subscription: Stripe.Subscription, supabase: SupabaseClient) {
  // Update subscription status to canceled, finding it by its Stripe ID (which is our PK 'id')
  console.log(`[handleSubscriptionDeleted] Marking subscription ${subscription.id} as canceled.`);
  const { error } = await supabase
    .from('subscriptions')
    .update({
      status: 'canceled', // Set status to 'canceled'
      ended_at: subscription.ended_at ? new Date(subscription.ended_at * 1000).toISOString() : new Date().toISOString(), // Use ended_at if available, else now
      canceled_at: subscription.canceled_at ? new Date(subscription.canceled_at * 1000).toISOString() : new Date().toISOString(), // Use canceled_at if available, else now
      updated_at: new Date().toISOString(),
    })
    .eq('id', subscription.id); // Use the 'id' column (Stripe Sub ID) to find the record

  if (error) {
    console.error(`[handleSubscriptionDeleted] Error marking subscription ${subscription.id} as canceled:`, error);
  } else {
    console.log(`[handleSubscriptionDeleted] Successfully marked subscription ${subscription.id} as canceled.`);
  }
}

/**
 * Handle invoice.payment_succeeded event
 */
async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice, supabase: SupabaseClient) {
  console.log(`[handleInvoicePaymentSucceeded] Processing invoice: ${invoice.id}`);

  // Ensure customer ID exists
  if (!invoice.customer) {
    console.error(`[handleInvoicePaymentSucceeded] Invoice ${invoice.id} missing customer ID.`);
    return;
  }
  const customerId = invoice.customer as string;
  console.log(`[handleInvoicePaymentSucceeded] Customer ID: ${customerId}`);

  // UPDATED: More robust subscription ID extraction
  // Try multiple possible locations for the subscription ID
  let subscriptionId: string | null = null;
  
  // Check direct subscription property
  if ((invoice as any).subscription) {
    subscriptionId = (invoice as any).subscription as string;
  } 
  // Check for subscription in lines data
  else if (invoice.lines?.data && invoice.lines.data.length > 0) {
    const lineWithSubscription = invoice.lines.data.find(line => (line as any).subscription);
    if (lineWithSubscription) {
      subscriptionId = (lineWithSubscription as any).subscription as string;
    }
  }
  
  if (!subscriptionId) {
    console.warn(`[handleInvoicePaymentSucceeded] Invoice ${invoice.id} does not appear to be related to a subscription.`);
    return;
  }
  console.log(`[handleInvoicePaymentSucceeded] Subscription ID: ${subscriptionId}`);

  try {
    // Find the subscription in our database using the Stripe subscription ID
    console.log(`[handleInvoicePaymentSucceeded] Fetching subscription record for Stripe ID: ${subscriptionId}`);
    const { data: existingSubscription, error: fetchError } = await supabase
      .from('subscriptions')
      .select('id, user_id, plan_id, status')
      .eq('id', subscriptionId)
      .maybeSingle(); // Use maybeSingle() in case the subscription isn't found (e.g., handled by checkout)

    if (fetchError) {
      console.error(`[handleInvoicePaymentSucceeded] Error fetching subscription from DB:`, fetchError);
      throw fetchError; // Rethrow to be caught by the outer handler
    }

    if (!existingSubscription) {
      // This might happen if the invoice.payment_succeeded arrives before checkout.session.completed finishes DB write.
      // Or if it's the very first payment invoice related to a checkout session that should have created the record.
      console.warn(`[handleInvoicePaymentSucceeded] Subscription ${subscriptionId} not found in database for invoice ${invoice.id}. This might be okay if checkout.session.completed handles creation.`);
      // Consider adding a delay/retry mechanism or logging this for investigation if it happens frequently.
      return;
    }
    console.log(`[handleInvoicePaymentSucceeded] Found existing subscription record: ${existingSubscription.id} for user: ${existingSubscription.user_id}`);

    // Check if the invoice status indicates a successful payment using type assertion for 'paid'
    // Stripe's Invoice object type correctly defines 'paid' as a boolean.
    if (invoice.status === 'paid' && (invoice as any).paid === true) {
      // Fetch the latest subscription data from Stripe to ensure we have the most up-to-date status and period dates
      console.log(`[handleInvoicePaymentSucceeded] Fetching latest subscription details from Stripe: ${subscriptionId}`);
      const stripeSubscription: Stripe.Subscription = await stripe.subscriptions.retrieve(subscriptionId);

      // UPDATED: Use the same robust period date extraction logic as in other handlers
      let safePeriodStart: string;
      let safePeriodEnd: string;

      // First try to get period dates from the subscription items
      const firstItem = stripeSubscription.items?.data?.[0];
      if (firstItem) {
        const periodStartTimestamp = (firstItem as any).current_period_start;
        const periodEndTimestamp = (firstItem as any).current_period_end;

        if (periodStartTimestamp && typeof periodStartTimestamp === 'number') {
          safePeriodStart = new Date(periodStartTimestamp * 1000).toISOString();
        } else {
          // Fall back to top-level properties
          const topLevelPeriodStart = (stripeSubscription as any).current_period_start;
          if (topLevelPeriodStart && typeof topLevelPeriodStart === 'number') {
            safePeriodStart = new Date(topLevelPeriodStart * 1000).toISOString();
          } else {
            console.warn(`[handleInvoicePaymentSucceeded] Invalid current_period_start from Stripe for sub ${stripeSubscription.id}. Defaulting to now.`);
            safePeriodStart = new Date().toISOString();
          }
        }

        if (periodEndTimestamp && typeof periodEndTimestamp === 'number') {
          safePeriodEnd = new Date(periodEndTimestamp * 1000).toISOString();
        } else {
          // Fall back to top-level properties
          const topLevelPeriodEnd = (stripeSubscription as any).current_period_end;
          if (topLevelPeriodEnd && typeof topLevelPeriodEnd === 'number') {
            safePeriodEnd = new Date(topLevelPeriodEnd * 1000).toISOString();
          } else {
            console.warn(`[handleInvoicePaymentSucceeded] Invalid current_period_end from Stripe for sub ${stripeSubscription.id}. Defaulting to now.`);
            safePeriodEnd = new Date().toISOString();
          }
        }
      } else {
        // No items found, try top-level properties as fallback
        const topLevelPeriodStart = (stripeSubscription as any).current_period_start;
        const topLevelPeriodEnd = (stripeSubscription as any).current_period_end;

        if (topLevelPeriodStart && typeof topLevelPeriodStart === 'number') {
          safePeriodStart = new Date(topLevelPeriodStart * 1000).toISOString();
        } else {
          console.warn(`[handleInvoicePaymentSucceeded] Invalid current_period_start from Stripe for sub ${stripeSubscription.id}. Defaulting to now.`);
          safePeriodStart = new Date().toISOString();
        }

        if (topLevelPeriodEnd && typeof topLevelPeriodEnd === 'number') {
          safePeriodEnd = new Date(topLevelPeriodEnd * 1000).toISOString();
        } else {
          console.warn(`[handleInvoicePaymentSucceeded] Invalid current_period_end from Stripe for sub ${stripeSubscription.id}. Defaulting to now.`);
          safePeriodEnd = new Date().toISOString();
        }
      }

      console.log(`[handleInvoicePaymentSucceeded] Updating subscription ${existingSubscription.id} in DB to status: ${stripeSubscription.status}`);
      const { error: updateError } = await supabase
        .from('subscriptions')
        .update({
          status: stripeSubscription.status,
          current_period_start: safePeriodStart,
          current_period_end: safePeriodEnd,
          updated_at: new Date().toISOString(),
          latest_invoice_id: invoice.id // Store the latest successful invoice ID
        })
        .eq('id', existingSubscription.id);

      if (updateError) {
        console.error(`[handleInvoicePaymentSucceeded] Error updating subscription in DB:`, updateError);
        throw updateError; // Rethrow to be caught by the outer handler
      }
      console.log(`[handleInvoicePaymentSucceeded] Successfully updated subscription ${existingSubscription.id} in DB.`);
    } else {
      console.log(`[handleInvoicePaymentSucceeded] Invoice ${invoice.id} status is ${invoice.status} (paid: ${(invoice as any).paid}), not processing as successful payment update.`);
    }

  } catch (error) {
    console.error(`[handleInvoicePaymentSucceeded] Error processing invoice ${invoice.id}:`, error);
    throw error; // Rethrow to be caught by the main handler
  }
}

/**
 * Handle invoice.payment_failed event
 */
async function handleInvoicePaymentFailed(invoice: Stripe.Invoice, supabase: SupabaseClient) {
  const subscriptionId = (invoice as any).subscription as string;
  if (!subscriptionId) {
    console.log(`[handleInvoicePaymentFailed] Invoice ${invoice.id} is not related to a subscription.`);
    return; // Not a subscription invoice
  }
  console.log(`[handleInvoicePaymentFailed] Processing failed payment for invoice ${invoice.id}, subscription ${subscriptionId}`);

  // Update the subscription status in our database to 'past_due' or another appropriate status
  // Find the subscription using its Stripe ID (which is our primary key 'id')
  const { error } = await supabase
    .from('subscriptions')
    .update({
      status: 'past_due', // Or 'unpaid' depending on your desired status flow
      latest_invoice_id: invoice.id,
      updated_at: new Date().toISOString(),
    })
    .eq('id', subscriptionId); // Use the 'id' column (Stripe Sub ID) to find the record

  if (error) {
    console.error(`[handleInvoicePaymentFailed] Error updating subscription ${subscriptionId} status after failed payment:`, error);
  } else {
    console.log(`[handleInvoicePaymentFailed] Successfully updated subscription ${subscriptionId} status to 'past_due'.`);
  }
  // You might also want to trigger notifications to the user here.
}