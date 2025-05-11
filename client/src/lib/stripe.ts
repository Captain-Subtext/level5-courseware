import { loadStripe } from '@stripe/stripe-js';

// Initialize Stripe with your publishable key from environment variables
// Use import.meta.env for Vite client-side variables
export const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '');

// Subscription plan Type identifiers (match values passed to createCheckoutSession)
export const STRIPE_PLANS = {
  MONTHLY: 'monthly',
  ANNUAL: 'annual',
};

// Removed wrapper functions that called the deleted ../api/stripe
// Components should now import directly from @/api/subscription

// Helper function to redirect to Stripe Checkout
export async function redirectToCheckout(sessionId: string) {
  const stripe = await stripePromise;
  if (!stripe) {
    throw new Error('Stripe failed to load');
  }

  const { error } = await stripe.redirectToCheckout({ sessionId });
  
  if (error) {
    console.error('Error redirecting to checkout:', error);
    throw error;
  }
}

// Removed getSubscriptionDetails wrapper
// Removed cancelSubscription wrapper 