# Deployment Guide

This document provides step-by-step instructions for deploying the Courseware Learning Platform to Railway. The application consists of two separate services (frontend and backend) that need to be deployed together.

## Prerequisites

- A Railway account (https://railway.app/)
- A Supabase account with database already set up and configured
- A Stripe account with products and prices created
- A Brevo account for email notifications (optional)
- Your code repository on GitHub

## Step 1: Configure Supabase

1. Create a new Supabase project
2. Run the database schema script located at `server/db/consolidated_prod_schema.sql` in the Supabase SQL Editor
3. Note down your Supabase URL and Service Role Key from the Supabase dashboard

## Step 2: Configure Stripe

1. Create an account on Stripe (or use an existing one)
2. Create products and pricing plans that match those in your application
3. Set up a webhook endpoint (you'll configure this later after deployment)
4. Note down your Stripe Secret Key and Publishable Key

## Step 3: Deploy to Railway

### Backend Service

1. Create a new Railway project
2. Add a new service from GitHub repository
3. Select the repository and the branch you want to deploy
4. Configure the following environment variables:

```
NODE_ENV=production
PORT=8080
CLIENT_URL=https://your-frontend-domain.com
DATABASE_URL=your-supabase-database-url
SUPABASE_URL=your-supabase-project-url
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
STRIPE_SECRET_KEY=your-stripe-secret-key
STRIPE_WEBHOOK_SECRET=your-stripe-webhook-secret
JWT_SECRET=your-own-random-string
COOKIE_DOMAIN=.your-domain.com
ADMIN_EMAIL=admin@your-domain.com
ADMIN_SENDER_EMAIL=noreply@your-domain.com
BREVO_API_KEY=your-brevo-api-key 
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret
```

5. Set the start command to `cd server && npm start`
6. Deploy the service and note down the URL

### Frontend Service

1. Add another service to your Railway project
2. Select the same repository
3. Configure the following environment variables:

```
VITE_API_BASE_URL=https://your-backend-service-url
VITE_SUPABASE_URL=your-supabase-project-url
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
VITE_STRIPE_PUBLISHABLE_KEY=your-stripe-publishable-key
```

4. Set the start command to `cd client && npm start`
5. Deploy the service

## Step 4: Configure Custom Domains (Optional)

1. In Railway, go to each service and add a custom domain
2. Configure your DNS to point to the Railway-provided CNAME values
3. Update your environment variables to reflect these custom domains

## Step 5: Update Stripe Webhook

1. After deployment, update your Stripe webhook endpoint to point to:
   `https://your-backend-domain.com/api/webhooks/stripe`
2. Update the webhook secret in your backend environment variables

## Step 6: Test Your Deployment

1. Visit your frontend domain to ensure the site loads properly
2. Test registration and login functionality
3. Verify course content loading
4. Test the payment process

## Admin Configuration

After deployment, you can access the admin dashboard at `/admin` and configure:

1. Course modules and sections
2. Subscription plans
3. Site settings
4. Email notification preferences

The first user who registers with the email matching the `ADMIN_EMAIL` environment variable will automatically get admin privileges.

## Admin Email Configuration - do this BEFORE you register your account

The admin email must be configured in multiple places to ensure proper admin access. Here's a comprehensive list of all places that need to be updated:

1. **Database Schema**: In `server/db/consolidated_prod_schema.sql`, the `is_admin_by_email()` function contains:
   ```sql
   admin_email TEXT := 'admin@example.com'; -- Define admin email here
   ```
   This should be updated to match your admin email before running the schema script.

2. **Environment Variables**: Set the `ADMIN_EMAIL` environment variable in your backend service:
   ```
   ADMIN_EMAIL=admin@your-domain.com
   ```

3. **Client-side Files**: The following files contain hardcoded admin email references that should be updated:
   - `client/src/lib/auth.tsx`: Line ~134: `const adminEmail = 'admin@example.com';`
   - `client/src/pages/AccountPage.tsx`: Line ~478: `const isAdmin = user?.email === "admin@example.com";`
   - `client/src/pages/admin/Analytics.tsx`: Line ~321: (commented out) `// const isAdmin = user?.email === 'admin@example.com';`

4. **Email Sender**: Set the `ADMIN_SENDER_EMAIL` environment variable for outgoing emails:
   ```
   ADMIN_SENDER_EMAIL=noreply@your-domain.com
   ```

5. **Email Service Files**: The following server-side files contain hardcoded email references:
   - `server/src/lib/emailBrevoService.ts`: 
     - Line 8-9: `DEFAULT_SENDER_EMAIL` is set to `admin@example.com` and `DEFAULT_SENDER_NAME` is set to `Courseware Platform`   (Make sure you change these values)
     - Line 10: `RECIPIENT_EMAIL` is set to `admin@example.com`
   - `server/src/lib/emailService.ts`:
     - Line 8: `RECIPIENT_EMAIL` is set to `admin@example.com` (fallback)
     - Line 50: Email sender address uses `noreply@example.com` as fallback

6. **Supabase Client Identifier**: Update the client identifier in `server/src/lib/supabase.ts`:
   - Line 26: Change `'X-Supabase-Client': 'courseware-server'` to your own identifier like `'your-app-name-server'`

Ideally, all of these values should be updated to use environment variables instead of hardcoded values to make the application more configurable.

## Troubleshooting

If you encounter issues during deployment:

1. Check Railway logs for any error messages
2. Verify all environment variables are correctly set
3. Ensure your Supabase schema was properly applied
4. Check CORS settings if frontend cannot communicate with backend

For more detailed troubleshooting, refer to the codebase documentation or open an issue on GitHub. 