import apiClient from '@/lib/apiClient'; // Import the configured axios instance

// Define interfaces if needed, or import from types
interface CheckoutSessionResponse {
  sessionId: string;
  // Add other potential response fields
}

interface PortalSessionResponse {
  url: string;
  // Add other potential response fields
}

interface SubscriptionDetailsResponse {
  // Define the structure based on what the server endpoint actually returns
  id: string;
  status: string;
  plan_name: string;
  current_period_end: number; // Unix timestamp
  cancel_at_period_end: boolean;
}

interface CancelSubscriptionResponse {
  // Define based on server response
  success: boolean;
  message?: string;
}

/**
 * Creates a Stripe Checkout Session via the backend API.
 */
export async function createCheckoutSession(planType: string): Promise<CheckoutSessionResponse> {
  try {
    // apiClient handles base URL and authentication
    const response = await apiClient.post<CheckoutSessionResponse>('/api/subscription/create-checkout', {
      planType: planType, // Send plan type (e.g., 'monthly', 'annual')
      // returnUrl is handled by the backend using CLIENT_URL env var
    });
    return response.data;
  } catch (error: any) {
    console.error('Error creating checkout session:', error);
    // Rethrow or handle error appropriately for the UI
    throw new Error(error.response?.data?.error || 'Failed to create checkout session');
  }
}

/**
 * Creates a Stripe Customer Portal Session via the backend API.
 * ACCEPTS userId and sends it in the request body.
 */
export async function createPortalSession(userId: string): Promise<PortalSessionResponse> { // <-- Added userId parameter
  try {
    // apiClient handles base URL and authentication
    const response = await apiClient.post<PortalSessionResponse>('/api/subscription/create-portal', {
      userId: userId // <-- Send userId in the request body
      // returnUrl is handled by the backend using CLIENT_URL env var
    });
    return response.data;
  } catch (error: any) {
    console.error('Error creating portal session:', error);
    // Rethrow or handle error appropriately for the UI
    throw new Error(error.response?.data?.error || 'Failed to create portal session');
  }
}

/**
 * Gets subscription details via the backend API.
 * Note: The original function passed userId, but this should be derived
 * from the authenticated session on the backend via the token attached by apiClient.
 */
export async function getSubscriptionDetails(): Promise<SubscriptionDetailsResponse | null> {
  try {
    // apiClient handles base URL and authentication (userId inferred on backend)
    const response = await apiClient.get<SubscriptionDetailsResponse>('/api/user/subscription'); // Endpoint matches AccountPage
    // AccountPage expects null if no subscription, so we return response.data directly
    // which could be null or the details object
    return response.data;
  } catch (error: any) {
    console.error('Error getting subscription details:', error);
    // Return null or throw, depending on how AccountPage handles this API failure
    if (error.response?.status === 404) {
        return null; // No subscription found is not necessarily an error here
    }
    // For other errors, maybe throw
    // throw new Error(error.response?.data?.error || 'Failed to get subscription details');
    return null; // Returning null to match original function's behavior on error
  }
}

/**
 * Cancels a subscription via the backend API.
 * Note: The original function passed subscriptionId. The backend should
 * ideally determine the correct subscription to cancel based on the authenticated user.
 * If sending the ID is required, uncomment the body line.
 */
export async function cancelSubscription(subscriptionId: string): Promise<CancelSubscriptionResponse> {
   try {
     // apiClient handles base URL and authentication
     const response = await apiClient.post<CancelSubscriptionResponse>('/api/subscription/cancel', {
       subscriptionId: subscriptionId // Send subscriptionId if required by backend
     });
     return response.data;
   } catch (error: any) {
     console.error('Error cancelling subscription:', error);
     // Rethrow or handle error appropriately for the UI
     throw new Error(error.response?.data?.error || 'Failed to cancel subscription');
   }
}