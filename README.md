# Level 5 Lifestyle Courseware Learning Platform

A comprehensive learning platform built with React, Express, Supabase, and Stripe. This platform is designed to serve educational content with subscription functionality, user progress tracking, and a complete admin dashboard.

## Overview

The Courseware platform provides a full-featured learning system that can be customized for various educational needs. It features user authentication, progress tracking, subscription management, and a rich admin interface for content management.

## Features

- **User Authentication**: Secure registration, login, and profile management
- **Course Content**: Rich, organized educational content with modules and sections
- **Progress Tracking**: Automatically tracks user completion of course sections
- **Subscription Management**: Stripe integration for premium access
- **Admin Dashboard**: Full control over users, courses, and system settings
- **Responsive Design**: Works on desktop, tablet, and mobile devices

## Technology Stack

- **Frontend**: React, TypeScript, Shadcn UI, Tailwind CSS
- **Backend**: Node.js, Express
- **Database**: Supabase (PostgreSQL)
- **Payment Processing**: Stripe
- **Email**: Brevo (formerly Sendinblue)
- **Deployment**: Railway

## Getting Started

Please see the [Deployment Guide](./DEPLOYMENT.md) for detailed setup instructions.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support, please open an issue on GitHub or contact the administrator.

## Features

- **User-friendly Interface**: Modern, responsive design with Shadcn UI components
- **Progress Tracking**: Monitor course completion for each user
- **Content Management**: Easily create, edit, and organize course modules and sections
- **Admin Dashboard**: Comprehensive tools for user management and content administration
- **Maintenance Mode**: Control platform availability during updates
- **Advanced Settings**: Customize platform behavior through admin settings
- **User Bookmarks**: Allow users to bookmark important content for quick access
- **Database Backup**: Download a backup of the entire platform database
- **Content Backup & Restore**:
  - Full backup and restore of course content (modules and sections)
  - Granular module-specific or section-specific backup and restore
  - Intelligent section restoration that matches existing modules
- **Subscription Management**:
  - Secure payment processing with Stripe
  - Multiple subscription tiers (free, monthly, annual)
  - Customer portal for self-service subscription management
  - Premium content access control
- **Email Notification System**:
  - User preference management for different notification types
  - Content update notifications for subscribed users
  - Account change alerts
  - Marketing communications (opt-in)


## Admin Features

The platform includes a robust admin interface with the following capabilities:

- Content management (create, edit, delete, and organize modules and sections)
- User management (view, edit, and manage user accounts)
- Analytics dashboard with course engagement metrics (including accurate total user count)
- Maintenance mode toggle for platform updates
- Advanced settings for platform configuration
- Content duplication for quick course expansion
- Comprehensive backup and restore functionality:
  - Full system backup (downloadable JSON)
  - Granular module and section backup
  - Intelligent content restoration

## Project Structure

### Core Files and Directories

```
cursor-learning/
├── client/            # Frontend React application (Vite)
│   ├── public/
│   ├── src/
│   │   ├── components/ # Reusable React components
│   │   │   ├── ui/       # Shadcn UI components
│   │   │   ├── Navbar.tsx
│   │   │   ├── Footer.tsx
│   │   │   ├── ProtectedRoute.tsx # Wraps routes requiring authentication
│   │   │   ├── StripePaymentForm.tsx
│   │   │   └── ... (other shared components like MaintenanceMode)
│   │   ├── lib/          # Client-side libraries & utilities
│   │   │   ├── auth.tsx      # Authentication context (uses Supabase client)
│   │   │   ├── supabase.ts   # Supabase client instance (primarily for auth)
│   │   │   ├── apiClient.ts  # Axios instance for backend API calls
│   │   │   ├── theme.tsx     # Theme provider
│   │   │   ├── notifications.ts # Client-side notification utility functions
│   │   │   └── ... (hooks like useDebounce, security utils)
│   │   ├── pages/        # Page components
│   │   │   ├── admin/      # Admin-specific pages
│   │   │   ├── AccountPage.tsx
│   │   │   ├── SignInPage.tsx
│   │   │   ├── DashboardPage.tsx # Main user dashboard with content/search
│   │   │   └── ... (Landing, static pages, NotFound)
│   │   ├── App.tsx       # Main app component with routing setup
│   │   └── main.tsx      # Entry point
│   ├── src/           # Main source code
│   ├── Dockerfile     # Docker configuration for Railway deployment
│   ├── nginx.conf     # Nginx configuration for serving the client
│   ├── index.html
│   ├── package.json
│   ├── vite.config.ts
│   └── tsconfig.json
├── server/            # Backend Node.js/Express application
│   ├── db/            # Database schema and migration scripts
│   │   ├── *.sql      # SQL files for tables, functions, triggers, RLS
│   │   └── README.md
│   ├── src/           # Server source code
│   │   ├── lib/       # Server-side libraries
│   │   │   ├── supabase.ts # Supabase Admin client instance (service role)
│   │   │   ├── emailService.ts # Handles contact form emails via Google OAuth
│   │   │   └── emailBrevoService.ts # Handles transactional/marketing emails via Brevo SDK
│   │   ├── services/  # Business logic services
│   │   │   └── notificationService.ts # Logic for sending notifications
│   │   ├── api/       # API route handlers (grouped by resource)
│   │   │   ├── user.ts   # User profile, password, subscription, prefs routes
│   │   │   ├── admin.ts  # Admin-specific routes (users, content, settings)
│   │   │   ├── config.ts # Public/Admin config routes (e.g., maintenance status)
│   │   │   ├── modules.ts
│   │   │   ├── sections.ts
│   │   │   ├── bookmarks.ts
│   │   │   ├── search.ts # Content search route
│   │   │   └── error-utils.ts # Centralized error handler
│   │   ├── middleware/  # Express middleware
│   │   │   └── auth.ts   # JWT authentication verification
│   │   └── server.ts    # Express server setup and entry point
│   ├── api/           # API route handlers
│   ├── middleware/    # Express middleware
│   ├── server.ts      # Express server setup and entry point
│   ├── package.json
│   └── tsconfig.json
├── .env.example       # Example environment variables for client and server
├── .gitignore
├── CHANGELOG.md
├── README.md
├── SEO_FIXES.md       # Documentation of SEO improvements for Google Search Console
└── ... (other root files like backup scripts)
```

## Setup (Local Development)

1.  **Clone the repository.**
2.  **Client Setup:**
    *   Navigate to the `client/` directory.
    *   Copy `.env.example` (if provided for client) or create `.env` and fill in:
        *   `VITE_SUPABASE_URL`: Your Supabase Project URL.
        *   `VITE_SUPABASE_ANON_KEY`: Your Supabase Anon Key.
        *   `VITE_STRIPE_PUBLISHABLE_KEY`: Your Stripe **Test** Publishable Key.
        *   `VITE_API_BASE_URL=http://localhost:8080`: Points to your local backend.
    *   Run `npm install`.
    *   Run `npm run dev` to start the Vite development server. It will attempt to run on `http://localhost:80`. 
        *   **Note:** Port 80 is a privileged port on macOS/Linux, so you may need to run `sudo npm run dev`.
3.  **Server Setup:**
    *   Navigate to the `server/` directory.
    *   Ensure `NODE_ENV` is **not** set to `production` (it should default to development).
    *   Copy `.env.example` (if provided for server) or create `.env` (this file is gitignored) and fill in:
        *   `CLIENT_URL=http://localhost`: Allowed origin for your local frontend.
        *   `DATABASE_URL`: Your Supabase Database connection string.
        *   `SUPABASE_URL`: Your Supabase Project URL.
        *   `SUPABASE_SERVICE_ROLE_KEY`: Your Supabase Service Role Key (keep secret!).
        *   `STRIPE_SECRET_KEY`: Your Stripe **Test** Secret Key.
        *   `STRIPE_WEBHOOK_SECRET`: Your Stripe **Test** Webhook Signing Secret.
        *   `JWT_SECRET`: A strong, unique secret (generate one).
        *   `BREVO_API_KEY`: Your Brevo API key for email notifications.
        *   'GOOGLE_CLIENT_ID': Google OAuth Credentials for the contact form.
        *   'GOOGLE_CLIENT_SECRET': Google OAuth Credientials for the contact form.
    *   Run `npm install`.
    *   Run `npm run dev` (or your dev script) to start the Express development server (listens on `http://localhost:8080`).
4.  **Database Setup:**
    *   Set up a new Supabase project for dev to run connected to your local machine.  Then another one for Production that will connect to your deployed instance.
    *   Apply the consolidated SQL script (`server/db/consolidated_prod_schema.sql` - **Note:** Need to create this consolidated file) to the new database(s). This script should include necessary tables, Row Level Security (RLS) policies, and helper functions (like `count_total_users()`).
    *   **IMPORTANT:** Manually update the `stripe_price_id` and `stripe_product_id` values within the script's `INSERT INTO public.plans` statement with your actual **Live** Stripe IDs before running it on the production database.

## Email Notification System

The platform includes a comprehensive email notification system that allows users to manage their notification preferences and receive various types of communications based on those preferences.

### User Preference Storage

- User notification preferences are stored in the `profiles` table within a JSONB column called `email_preferences`
- Default values are `{"contentUpdates": true, "accountChanges": true, "marketing": false}`
- Users can update these preferences in their Account page under the Preferences tab

### Notification Types

1. **Content Updates** (`contentUpdates`): Notifications about new modules, sections, or major course updates
2. **Account Changes** (`accountChanges`): Security alerts for password changes, logins from new devices, etc.
3. **Marketing** (`marketing`): Opt-in for occasional promotional emails and product news

### Email Service Architecture

The platform uses a dual email service approach:

1. **Contact Form Emails** (`emailService.ts`):
   - Uses Google OAuth for sending contact form submissions
   - Only used for the website contact form

2. **Transactional & Marketing Emails** (`emailBrevoService.ts`):
   - Uses the Brevo SDK (`@getbrevo/brevo`) for all other application emails
   - Handles user notifications based on their preferences
   - Configured via the `BREVO_API_KEY` environment variable
   - Sign up to Brevo for free and you can get your API key in the settings.  You will also need to add DNS records to your domain for verification

3. **Notification Service** (`notificationService.ts`):
   - Business logic for sending notifications
   - Queries users based on their preferences in the `email_preferences` column
   - Uses the Brevo service to send the actual emails

### Email Configuration

- The platform uses Brevo's SMTP settings as the custom SMTP server in Supabase for authentication emails
- Transactional and marketing emails are sent directly via the Brevo SDK
- Default sender information is configured in environment variables:
  - `ADMIN_SENDER_EMAIL`: Default sender email address
  - `ADMIN_SENDER_NAME`: Default sender name
  - `ADMIN_RECIPIENT_EMAIL`: Default recipient for contact form submissions

## Deployment (Railway)

The application is deployed to Railway using two separate services within one project:

1.  **`frontend` Service:**
    *   **Source:** GitHub repository, Root Directory: `/client`
    *   **Deployment Method:** Dockerfile (uses `client/Dockerfile`)
    *   **Networking:** Generates a public `*.up.railway.app` domain or uses a Custom Domain (see below).
    *   **Required Environment Variables (Production):**
        *   `VITE_SUPABASE_URL`: Production Supabase Project URL.
        *   `VITE_SUPABASE_ANON_KEY`: Production Supabase Anon Key.
        *   `VITE_STRIPE_PUBLISHABLE_KEY`: Production Stripe **Live** Publishable Key.
        *   `VITE_API_BASE_URL`: The **public HTTPS URL** of the deployed `backend` service (e.g., `https://your-backend-name.up.railway.app` or `https://api.yourdomain.com`).

2.  **`backend` Service:**
    *   **Source:** GitHub repository, Root Directory: `/server`
    *   **Deployment Method:** Nixpacks (default) or Dockerfile (if added later).
    *   **Networking:** Generates a public `*.up.railway.app` domain or uses a Custom Domain.
    *   **Required Environment Variables (Production):**
        *   `NODE_ENV=production`
        *   `PORT=8080` (Railway injects this, but good to be explicit if needed)
        *   `CLIENT_URL`: The **public HTTPS URL** of the deployed `frontend`
        *   All remaining variable above will need to be populated.

3.  Railway requires CNAME Flattening for your domain name.  Therefore, it is recommended that you use Cloudflare's free DNS for your domain name and enable CNAME Flattening for your domain name as Railway doesn't provide an IP address to attach to an A record like Vercel would.