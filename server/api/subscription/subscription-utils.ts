// Use require for imports
// const { supabase } = require('../../src/lib/supabase'); // REMOVED: Will be passed as parameter
import { SupabaseClient } from '@supabase/supabase-js'; // Import type for parameter
const Stripe = require('stripe');

// Initialize Stripe (Stripe instance is still managed here)
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-03-31.basil', // Using the version expected by the Stripe package
});

/**
 * Get a user's active subscription
 * Accepts supabase client as parameter
 */
async function getUserSubscription(userId: string, supabase: SupabaseClient) { // Added supabase param
  if (!userId) return { data: null, error: new Error('User ID is required') };
  
  return await supabase // Use passed supabase
    .from('subscriptions')
    .select('*, plan:plans(*)')
    .eq('user_id', userId)
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(1)
    .single();
}

/**
 * Get a subscription by ID
 * Accepts supabase client as parameter
 */
async function getSubscriptionById(subscriptionId: string, supabase: SupabaseClient) { // Added supabase param
  if (!subscriptionId) return { data: null, error: new Error('Subscription ID is required') };
  
  return await supabase // Use passed supabase
    .from('subscriptions')
    .select('*')
    .eq('stripe_subscription_id', subscriptionId)
    .single();
}

/**
 * Get a plan by type identifier (monthly/annual) or UUID
 * Accepts supabase client as parameter
 */
async function getPlanById(planIdentifier: string, supabase: SupabaseClient) { // Added supabase param
  if (!planIdentifier) return { data: null, error: new Error('Plan identifier is required') };
  
  // First try to find the plan by UUID
  try {
    // Check if the identifier is a valid UUID
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(planIdentifier);
    
    if (isUuid) {
      // If it's a UUID, find by ID
      return await supabase // Use passed supabase
        .from('plans')
        .select('*')
        .eq('id', planIdentifier)
        .single();
    } else {
      // Otherwise find by plan_type (monthly, annual, etc.)
      return await supabase // Use passed supabase
        .from('plans')
        .select('*')
        .eq('plan_type', planIdentifier)
        .eq('active', true)
        .single();
    }
  } catch (error) {
    return { data: null, error: new Error('Failed to find plan: ' + (error instanceof Error ? error.message : String(error))) };
  }
}

/**
 * Get a user's Stripe customer ID, creating one if it doesn't exist
 * Accepts supabase client as parameter
 */
async function getOrCreateCustomerId(userId: string, supabase: SupabaseClient): Promise<{ customerId: string | null; error: Error | null }> { // Added supabase param
  if (!userId) return { customerId: null, error: new Error('User ID is required') };

  try {
    // Check if a subscription record already exists (it stores the customer ID)
    const { data: existingSubscription, error: subError } = await supabase // Use passed supabase
      .from('subscriptions')
      .select('stripe_customer_id')
      .eq('user_id', userId)
      .maybeSingle(); // Use maybeSingle as they might not have a subscription yet

    if (subError) {
      console.error('Error checking for existing subscription:', subError);
      // Don't throw here, maybe we can still create a customer
      // Fall through to potentially create a new customer
    }

    // If a customer ID exists on the subscription record, return it
    if (existingSubscription?.stripe_customer_id) {
      return { customerId: existingSubscription.stripe_customer_id, error: null };
    }

    // If no customer ID found, need to fetch user email from auth.users
    const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(userId); // Use passed supabase

    if (authError || !authUser?.user?.email) {
      return { customerId: null, error: authError || new Error('User not found in auth or email is missing') };
    }

    // Create a new customer in Stripe using the email from auth.users
    console.log(`Creating new Stripe customer for user ${userId} with email ${authUser.user.email}`);
    const customer = await stripe.customers.create({
      email: authUser.user.email, // Use email from auth.users
      metadata: {
        userId: userId
      }
    });

    // IMPORTANT: Do NOT update the profiles table here.
    // The customer ID should be stored in the 'subscriptions' table.
    // The Stripe webhook handler (listening for checkout.session.completed
    // or customer.subscription.created) is responsible for creating the
    // initial subscription record in your DB, including the customer ID.

    console.log(`Created Stripe customer ${customer.id} for user ${userId}`);
    return { customerId: customer.id, error: null };

  } catch (error: any) {
    console.error(`Error in getOrCreateCustomerId for user ${userId}:`, error);
    return { customerId: null, error: error instanceof Error ? error : new Error('Failed to get or create Stripe customer') };
  }
}

// Export all functions using module.exports
module.exports = {
  stripe,
  getUserSubscription,
  getSubscriptionById,
  getPlanById,
  getOrCreateCustomerId,
}; 