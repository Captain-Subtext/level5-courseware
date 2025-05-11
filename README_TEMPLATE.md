# Cursor Learning Platform

A comprehensive learning platform built with React, Express, Supabase, and Stripe. This platform is designed to serve educational content with subscription functionality, user progress tracking, and a complete admin dashboard.

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
  - Multiple subscription tiers (monthly, annual)
  - Customer portal for self-service subscription management
  - Premium content access control
- **Email Notification System**:
  - User preference management for different notification types
  - Content update notifications for subscribed users
  - Account change alerts
  - Marketing communications (opt-in)

## Project Structure

### Core Files and Directories

```
cursor-learning/
├── client/            # Frontend React application (Vite)
│   ├── public/
│   │   └── ... (other directories and files)
│   ├── Dockerfile     # Docker configuration for Railway deployment
│   ├── nginx.conf     # Nginx configuration for serving the client
│   └── ... (config files)
├── server/            # Backend Node.js/Express application
│   ├── db/            # Database schema and migration scripts
│   ├── src/           # Server source code
│   │   └── ... (other directories and files)
│   ├── api/           # API route handlers
│   ├── middleware/    # Express middleware
│   ├── server.ts      # Express server setup and entry point
│   └── ... (config files)
└── ... (other root files like backup scripts)
```

## Setup Requirements

### Prerequisites

- Node.js (v16+)
- npm or yarn
- PostgreSQL database (via Supabase)
- Stripe account (for payment processing)
- Brevo account (for email notifications)
- Railway account (for deployment) or similar hosting service

### Services Setup

1. **Supabase Setup**
   - Create a new Supabase project
   - Run the consolidated database script from `server/db/consolidated_prod_schema.sql`
   - Make sure to replace all placeholder values like `{{ADMIN_EMAIL}}` with your actual values
   - Save your Supabase URL, anon key, and service role key for environment variables

2. **Stripe Setup**
   - Create a Stripe account
   - Create products for monthly and annual subscriptions
   - Make note of your price IDs and product IDs
   - Create a webhook endpoint that points to your backend `/api/webhooks/stripe`
   - Obtain your publishable key, secret key, and webhook signing secret

3. **Brevo Setup**
   - Create a Brevo account
   - Set up sender email
   - Create three lists: Content Updates, Marketing, and Account Changes
   - Create contact attributes for preferences
   - Obtain your API key

## Local Development

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/cursor-learning.git
   cd cursor-learning
   ```

2. **Client Setup**
   - Navigate to the `client/` directory
   - Copy `.env.example` to `.env` and fill in required values
   - Run `npm install`
   - Run `npm run dev` (note: may require sudo on port 80)

3. **Server Setup**
   - Navigate to the `server/` directory
   - Copy `.env.example` to `.env` and fill in required values
   - Run `npm install`
   - Run `npm run dev`

## Deployment

The application is designed to be deployed to Railway as two separate services within one project:

1. **Frontend Service**
   - Deploys from `/client` directory using the included Dockerfile
   - Requires environment variables as per `.env.example`

2. **Backend Service**
   - Deploys from `/server` directory using Nixpacks
   - Requires environment variables as per `.env.example`

See detailed deployment instructions in the [DEPLOYMENT.md](DEPLOYMENT.md) file.

## Admin Setup

1. After deploying the application, create a user account with the email you specified as `ADMIN_EMAIL`
2. Log in with this account
3. Navigate to `/admin` to access the admin dashboard
4. Initialize your content structure through the admin interface

## Monetization Options

If you're using this platform commercially:

1. Set up Stripe products and prices as per your business model
2. Update the plan table in Supabase with your actual Stripe product and price IDs
3. Customize the pricing display in the frontend code

If you're offering this as an open-source project:

1. Consider adding GitHub Sponsors or Open Collective links
2. Set up a contributor agreement/license that fits your needs
3. Create clear documentation for potential contributors

## Support and Contributions

If you encounter issues or want to contribute:

- Open an issue on GitHub
- Submit a pull request with proposed changes
- Follow the [CONTRIBUTING.md](CONTRIBUTING.md) guidelines

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Credits

Developed by [Your Name/Organization].

If you find this project useful, consider:
- Starring the repository
- Sharing it with others
- Contributing back improvements
- Supporting the development via donations 