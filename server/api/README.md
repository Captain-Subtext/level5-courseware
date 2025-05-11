# API Proxy Implementation

This API implementation serves as a proxy between the frontend and Supabase, removing the need for direct Edge Function calls which were causing CORS issues.

## Structure

- **`/api/index.ts`**: Main router for API requests
- **`/api/auth-utils.ts`**: Authentication utilities for API endpoints
- **`/api/error-utils.ts`**: Error handling utilities
- **`/api/subscription/`**: Endpoints for subscription management
  - **`get-details.ts`**: Get details of a user's subscription
  - **`create-checkout.ts`**: Create a checkout session for subscription purchase
  - **`create-portal.ts`**: Create a customer portal session for subscription management
  - **`cancel.ts`**: Cancel a subscription
  - **`subscription-utils.ts`**: Shared utilities for subscription endpoints

## Authentication Flow

1. Frontend makes authenticated requests using JWT tokens from Supabase Auth
2. API endpoints validate tokens through `authenticateRequest` function
3. Only authenticated users can access their own data (except for admin roles)

## Subscription Management

We use Stripe for payment processing and subscription management:

1. **Creating a subscription**:
   - User selects a plan in the UI
   - Frontend calls `/api/subscription/create-checkout` with plan details
   - API creates a Stripe checkout session
   - User is redirected to Stripe for payment
   - Webhook endpoint handles successful checkout events

2. **Managing a subscription**:
   - User accesses their account page
   - Frontend calls `/api/subscription/get-details` to display current subscription
   - For changes, frontend calls `/api/subscription/create-portal`
   - User is redirected to Stripe Customer Portal

3. **Canceling a subscription**:
   - User can cancel from the account page
   - Frontend calls `/api/subscription/cancel`
   - Subscription is marked for cancellation at period end

## Error Handling

We use standardized error responses across all endpoints with proper HTTP status codes:

- `400`: Bad Request (missing required parameters)
- `401`: Unauthorized (missing or invalid authentication)
- `403`: Forbidden (authenticated but lacks permission)
- `404`: Not Found (requested resource doesn't exist)
- `500`: Server Error (unexpected errors during processing)

## Environment Variables

The following environment variables are required:

- `STRIPE_SECRET_KEY`: Stripe API secret key
- `BASE_URL`: Base URL for callback redirects (optional, defaults to origin)

## Local Development

When developing locally, ensure your `.env` file includes the necessary variables.

To test webhooks locally, use Stripe CLI for webhook forwarding:

```bash
stripe listen --forward-to http://localhost:5173/api/webhooks/stripe
``` 