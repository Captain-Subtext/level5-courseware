import apiClient from '@/lib/apiClient';

// --- Stripe API Client Functions ---

/**
 * Calls the backend to create a Stripe Checkout Session.
 * @param planId - The ID of the subscription plan (e.g., 'monthly', 'annual').
 * @param userId - The ID of the user initiating the checkout.
 * @param returnUrl - Optional URL to redirect to after checkout.
 * @returns The session ID from Stripe.
 */
export async function createCheckoutSession(planId: string, userId: string, returnUrl?: string): Promise<{ sessionId: string }> {
  try {
    const response = await apiClient.post('/stripe/create-checkout-session', {
      planId,
      userId,
      returnUrl: returnUrl || window.location.origin + '/account?session_id={CHECKOUT_SESSION_ID}', // Default return URL
    });
    return response.data; // Assuming backend returns { sessionId: '...' }
  } catch (error) {
    console.error('Error creating Stripe checkout session:', error);
    throw error; // Re-throw for handling in the calling component
  }
}

/**
 * Calls the backend to create a Stripe Customer Portal Session.
 * @param userId - The ID of the user.
 * @param returnUrl - Optional URL to return to after portal interaction.
 * @returns The URL for the customer portal session.
 */
export async function createPortalSession(userId: string, returnUrl?: string): Promise<{ portalUrl: string }> {
  try {
    const response = await apiClient.post('/stripe/create-portal-session', {
      userId,
      returnUrl: returnUrl || window.location.origin + '/account', // Default return URL
    });
    return response.data; // Assuming backend returns { portalUrl: '...' }
  } catch (error) {
    console.error('Error creating Stripe portal session:', error);
    throw error;
  }
}

/**
 * Calls the backend to get subscription details for a user.
 * @param userId - The ID of the user.
 * @returns Subscription details (adjust type based on backend response).
 */
export async function getSubscriptionDetails(userId: string): Promise<any> { // TODO: Define a specific type for subscription details
  try {
    const response = await apiClient.get(`/stripe/subscription/${userId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching subscription details:', error);
    throw error;
  }
}

/**
 * Calls the backend to cancel a subscription.
 * @param subscriptionId - The ID of the subscription to cancel.
 * @returns Confirmation or updated subscription status (adjust type based on backend response).
 */
export async function cancelSubscription(subscriptionId: string): Promise<any> { // TODO: Define a specific type for the response
  try {
    const response = await apiClient.post('/stripe/cancel-subscription', { subscriptionId });
    return response.data;
  } catch (error) {
    console.error('Error canceling subscription:', error);
    throw error;
  }
} 