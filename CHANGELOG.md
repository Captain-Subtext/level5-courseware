# Changelog

All notable changes to the Cursor Learning Platform will be documented in this file.

## [1.0.13] - 2025-05-06

### Added
- **Notifications & Email System (Phase 1)**
  - Implemented Brevo API integration (`server/src/lib/emailBrevoService.ts`).
  - Configured Supabase Auth emails to use Brevo SMTP.
  - Added user email preference toggles (Marketing, Content Updates, Account Changes) in Account Settings -> Preferences tab.
  - Preferences are stored in the `profiles.email_preferences` JSONB column.
  - Set default email preferences to ON for new users via database default.
  - Updated existing users to have all email preferences ON initially.
  - **Implemented Brevo contact synchronization:**
    - New users are automatically added/synced to Brevo upon registration.
    - User preference changes (toggles) trigger updates to Brevo contacts.
    - Sync updates custom Brevo Text attributes (`PREF_MARKETING`, `PREF_CONTENT_UPDATES`, `PREF_ACCOUNT_CHANGES`) with "true"/"false".
    - Sync adds/removes contacts from corresponding Brevo lists (IDs 5, 2, 6) based on preferences.
  - Added Admin UI section (Settings -> Notifications) for manual Brevo contact synchronization (All, New, Content Subs, Marketing Subs).
- **Admin & Configuration**
  - Added endpoints for admin management of maintenance mode (`/api/admin/config/maintenance`) and announcement banner (`/api/admin/config/banner`).
  - Added endpoint (`/api/admin/backup/content`) and function (`get_content_backup`) for content backup.
  - Added admin endpoints for granting (`/grant-monthly`) and revoking (`/revoke-monthly`) manual subscriptions.
  - Added `record_security_event` function and triggers for improved security logging.

### Changed
- Refactored profile update API (`/api/user/profile`) for clarity and mandatory fields.
- Enhanced password update API (`/api/user/password`) with current password verification.
- Migrated user progress update (`/api/user/progress`) to handle upserting with `module_id`.
- Consolidated database schema into `consolidated_prod_schema.sql`.
- Updated various API endpoints to use shared `isAuthenticated` middleware.
- Improved error handling in several API routes using `handleSupabaseError`.

### Fixed
- **Subscription Renewal Issue**: Fixed error when users attempt to purchase a new subscription after canceling a previous one. The system now properly updates existing subscription records instead of attempting to create new ones, resolving the unique constraint violation on `user_id` (`subscriptions_user_id_key`).
- **Stripe Webhook Handlers**: Extended the period date fixes from `handleSubscriptionUpdated` to `handleCheckoutSessionCompleted` and `handleInvoicePaymentSucceeded` functions in `server/api/webhooks/stripe.ts`. Both functions now correctly extract period dates from the nested `items.data[0]` structure, with multiple fallback mechanisms for Stripe API version compatibility.
- **Invoice Subscription Link**: Improved the subscription ID extraction in `handleInvoicePaymentSucceeded` to check multiple locations within the invoice object (direct property and line items), preventing "Invoice does not appear to be related to a subscription" errors.
- Resolved issue where `user` object was sometimes null in `AuthProvider` during initial load.
- Addressed CSRF token retrieval and usage issues in Admin Settings save.
- Fixed SQL function `record_security_event` parameter mismatch.
- Corrected logic for displaying admin status/email on Account page.
- Fixed Brevo API client initialization errors (`setApiKey`, constructor issues).
- Corrected require path for `emailBrevoService` in `user.ts`.

## [1.0.13] - 2025-05-04

### Added
- Admin: Display user subscription tier (Free/Premium) in the user management table (`client/src/pages/admin/Users.tsx`).

### Fixed
- **Admin Content Restore:** Corrected admin permission check (`is_admin_by_email` function) used during content restore operations, resolving 404 errors.
- **Admin Manual Subscription Grant:** Resolved `duplicate key value violates unique constraint "subscriptions_stripe_subscription_id_key"` error when granting manual subscriptions to multiple users. Manual subscriptions now use a unique ID format (`manual_<user_id>`).
- **Admin Manual Subscription Grant/Revoke Cycle:** Ensured that granting a subscription to a user who previously had a manual subscription revoked correctly updates the existing record instead of causing errors.
- **Admin User List Subscription Status:** Fixed the `GET /api/admin/users` endpoint to accurately report `is_manual_subscription` status by correctly querying and interpreting subscription data.
- **Admin User Management UI:** Corrected the dropdown menu logic in the user management table (`Users.tsx`) to reliably show "Revoke Membership" for users with active manual subscriptions and "Grant Membership" for others.
- **Account Page DOM Warning:** Fixed an invalid HTML nesting issue (`<div>` inside `<p>`) on the Account > Subscription tab (`AccountPage.tsx`) that occurred when displaying the subscription plan badge for premium users.
- **Stripe Webhook (`customer.subscription.updated`, `customer.subscription.created`)**: Resolved issue where `current_period_start` and `current_period_end` dates were not updating correctly in the database. The handler (`handleSubscriptionUpdated` in `server/api/webhooks/stripe.ts`) now correctly fetches the live subscription object from Stripe and extracts period dates from the nested `items.data[0]` structure instead of attempting to access non-existent top-level properties on the retrieved object.
- Resolved database schema error (`PGRST204 - Could not find the 'cancel_at' column`) in Stripe webhook handler (`handleSubscriptionUpdated`) by removing attempt to update the non-existent `cancel_at` column in the `subscriptions` table.

### Changed
- **Manual Subscription ID Format:** Manual subscription grants now store `manual_<user_id>` in the `stripe_subscription_id` and `stripe_customer_id` columns instead of the static string 'manual' to ensure uniqueness per user.
- Content: Enabled rendering of GitHub Flavored Markdown (GFM) tables in module content (`client/src/pages/ModulePage.tsx`) using `remark-gfm`.


## [1.0.11] - 2025-04-28 (Admin Settings API & Logging)
### Changed
- Refactored Admin Settings save logic (`client/src/pages/admin/Settings.tsx`) to use a dedicated backend API endpoint (`PUT /api/admin/config/settings`) instead of direct client-side Supabase calls.

### Added
- New generic backend API endpoint (`PUT /api/admin/config/settings` in `server/api/admin.ts`) to handle updates for multiple configuration settings.
- Server-side logging (`record_security_event`) for general admin settings changes made via the new `PUT /api/admin/config/settings` endpoint.
- Server-side logging (`record_security_event`) added to the existing `PUT /api/admin/config/banner` and `PUT /api/admin/config/maintenance` endpoints.

### Fixed
- CSRF token validation errors (`403 Forbidden`) on Admin Settings save by correctly handling the Double Submit Cookie pattern in the frontend API client (`client/src/pages/admin/Settings.tsx`). Ensured CSRF token is fetched on load and sent with save requests.

## [1.0.10] - 2025-04-24 (Video Embedding Support)
### Added
- Support for embedding videos in Markdown content through a custom syntax `@[video](storage:video/filename.mp4)` (`client/src/pages/ModulePage.tsx`).
- Enhanced `rehypeSanitize` schema to allow video tags, iframes, and source elements with necessary attributes.
- Smart path handling to determine the correct bucket based on file path patterns.

### Changed
- Renamed image URL transformation function to `transformContent` to reflect its expanded capabilities.
- Improved media embedding to handle various content types beyond just images.

## [1.0.9] - 2025-04-23 (Google Updates & SEO Improvements)
### Added
- **SEO Fixes (`SEO_FIXES.md`)**: New documentation detailing Google Search Console issue resolution.
- Enhanced CSRF protection with secure, SameSite cookies to improve security across environments.
- Double Submit Cookie pattern implementation for better CSRF token validation.
- **SEO Component**: Created reusable `SEO.tsx` for consistent canonical URL handling across pages.

### Changed
- **Nginx Configuration**: Updated redirects for HTTP to HTTPS and www to non-www canonical domain handling.
- **Key Pages**: Added canonical URL metadata to main pages to prevent duplicate content issues.

### Fixed
- Google Search Console issues related to redirect chains and duplicate content without canonical tags.
- Cross-Site Request Forgery (CSRF) validation handling for state-changing requests.
- Inconsistent token capture in frontend API client.

## [1.0.6] - 2025-01-21 (Audio Embed & Minor Fixes)
### Added
- Support for embedding audio files using HTML `<audio>` tags in Markdown content by updating `rehype-sanitize` schema (`client/src/pages/ModulePage.tsx`).

### Changed
- Adjusted Table of Contents section title font size to `text-sm` for better consistency (`client/src/pages/ModulePage.tsx`).
- Removed verbose `console.log` statements from various client and server files (`auth.tsx`, `api.ts`, `server.ts`, `api/config.ts`, `MaintenanceMode.tsx`, `ContactPage.tsx`).

### Fixed
- Inconsistent Table of Contents icons for incomplete sections; now uses consistent `lucide-react/Circle` icon (`client/src/pages/ModulePage.tsx`).
- Removed unused variables and imports across multiple components (`ModulePage.tsx`, `admin/Content.tsx`, `ForgotPasswordPage.tsx`, `LandingPage.tsx`, `lib/api.ts`).

## [1.0.5] - YYYY-MM-DD (Auth State & Admin Metrics Fixes)
### Changed
- **AuthProvider (`client/src/lib/auth.tsx`)**: Refactored initialization logic to rely solely on `onAuthStateChange` listener for setting initial auth state (`session`, `user`). Removed profile fetching from the central `updateAuthState` function to prevent hangs during navigation/reload.
- **AuthProvider (`client/src/lib/auth.tsx`)**: Added `AbortController` logic to the `checkMaintenanceMode` helper function to properly cancel API requests during component cleanup.
- **DashboardPage (`client/src/pages/DashboardPage.tsx`)**: Updated to fetch user profile data locally within the component instead of relying on `useAuth().profile`.
- **Admin API (`server/api/admin.ts`)**: Modified the `/api/admin/dashboard-metrics` endpoint to use a dedicated SQL function (`count_total_users`) via RPC to correctly count users from `auth.users` instead of `profiles`.

### Fixed
- Resolved issue where navigating from authenticated pages to static pages (or reloading authenticated pages) resulted in a blank screen due to `AuthProvider` initialization hanging.
- Corrected the "Total Users" count on the Admin Dashboard to accurately reflect registered users in `auth.users`.
- Resolved race condition in Admin Content Backup page (`client/.../ContentBackup.tsx`) by waiting for auth state to load before fetching initial data.
- Fixed incorrect type imports in `client/src/lib/api.ts` (`User`).

### Added
- Created `count_total_users()` SQL function with `SECURITY DEFINER` privileges to count users in `auth.users`.
- Extensive debug logging added to `AuthProvider` (`client/src/lib/auth.tsx`) to trace initialization flow (to be removed later).

### Removed
- Insecure and non-functional client-side admin check (`is_admin` RPC call) from backup functions (`backupContent`, `backupModule`, `backupSection`) in `client/src/lib/api.ts`. Relies solely on backend API authorization.

## [1.0.4] - YYYY-MM-DD (Admin User UI & Minor Fixes)
### Added
- **Marketing Preference Display (`client/src/pages/admin/Users.tsx`)**: Added a read-only checkbox column to the Admin User Management table to display the marketing email preference.

### Changed
- **Admin API (`server/api/admin.ts`)**: Updated the `GET /api/admin/users` endpoint to fetch `email_preferences` from the `profiles` table and include a `marketing_preference` boolean field in the response.
- **Dashboard Layout (`client/src/pages/DashboardPage.tsx`)**: Increased the height of the scrollable course module area by adjusting the `h-[calc(100vh-...)]` class, pushing the footer down.
- **HTML Title (`client/index.html`)**: Updated the main HTML title to "Cursor for Non-Coders: The best place to build amazing apps with Cursor when you don't know how to code!".

### Fixed
- **Linting Errors**: Removed unused imports and variables in `client/src/pages/admin/Users.tsx` and `client/src/pages/DashboardPage.tsx`.

## [1.0.3] - YYYY-MM-DD (Email & Notification Service Setup)
### Added
- **Brevo Email Service (`server/src/lib/emailBrevoService.ts`)**: Added a new service using the `@getbrevo/brevo` SDK to handle transactional and marketing emails, configured via `BREVO_API_KEY`.
- **Notification Service (`server/src/services/notificationService.ts`)**: Created initial service with a function (`sendNewContentNotification`) to query users based on preferences stored in the `email_preferences` JSONB column (specifically the `contentUpdates` key) and send emails via the Brevo service.
- Required Node.js type definitions (`@types/node`) to `server/package.json` devDependencies.

### Changed
- **Email Service Responsibility**: Split email sending logic. The existing `emailService.ts` (using Google OAuth) is now solely responsible for the Contact Form submissions. The new `emailBrevoService.ts` will handle all other application emails.
- **Dependency Management**: Ran `npm audit fix --force` in `server/` to address vulnerabilities, updating `@getbrevo/brevo` potentially to v1.0.1.
- **Code Structure**: Added `export {}` to `emailService.ts` and `emailBrevoService.ts` to treat them as modules and resolve TypeScript redeclaration errors.

### Fixed
- Resolved potential TypeScript errors for `require`, `process`, `module` by installing `@types/node`.
- Corrected authentication method in `emailBrevoService.ts` to use `setApiKey` after SDK update.
- Eliminated linter errors related to duplicate variable/function declarations between the two email service files.

## [1.0.2] - YYYY-MM-DD (Dashboard & Landing Page Enhancements)
### Added
- Curriculum overview accordion section to the Landing Page (`client/src/pages/LandingPage.tsx`).

### Changed
- **Dashboard Layout (`client/src/pages/DashboardPage.tsx`):**
  - Made "Quick Links" and "Platform Links" collapsible under a "Resources" heading for improved mobile view.
  - Moved "Continue Learning" button into the "Your Progress" card header and made it smaller.
  - Added visual styling (background, border) to the scrollable "Course Modules" area for better distinction.
  - Moved "Premium" badge above the module title in course list for better text flow.
- **Dashboard Logic (`client/src/pages/DashboardPage.tsx`):**
  - Updated "Continue Learning" button logic to navigate to the first *incomplete* section within the first accessible module.
- **Landing Page Content (`client/src/pages/LandingPage.tsx`):**
  - Updated description in the "Features" section to better reflect course content breadth.
- **Account Page Layout (`client/src/pages/AccountPage.tsx`):**
  - Adjusted tab styling to ensure equal width and proper wrapping on mobile devices using Flexbox.
- **Development Configuration:**
  - Added local network IP addresses to CORS `allowedOrigins` in `server/server.ts` to facilitate testing from mobile devices on the local network.
- **Logging:**
  - Commented out verbose console logging in client (`apiClient.ts`, `auth.tsx`, `ProtectedRoute.tsx`) and server (`server.ts`, `api/config.ts`, `api/user.ts`) for cleaner development output.

### Fixed
- CORS errors when accessing the development server from devices on the local network other than localhost.

## [1.0.1] - YYYY-MM-DD (Post-Railway Migration Fixes)
### Fixed
- **Stripe Webhook (`checkout.session.completed`)**: 
  - Resolved TypeScript errors for `current_period_start`/`end`.
  - Handled `RangeError: Invalid time value` for period dates by adding safety checks and defaults.
  - Corrected database upsert logic to use Stripe Subscription ID as primary key (`id`) and removed incorrect `stripe_subscription_id` field, resolving `PGRST204` error.
- **Stripe Webhook (`invoice.payment_succeeded`)**:
  - Resolved TypeScript errors for `paid` property using type assertions.
- **Stripe Customer Portal (`/api/subscription/create-portal`)**:
  - Fixed 401 Unauthorized errors by correctly passing `supabase` client to `authenticateRequest`.
  - Fixed 400 Bad Request ("User ID is required") by updating client-side call to send `userId` in request body and updating backend API function signature (`createPortalSession` in `client/src/api/subscription.ts`).
  - Fixed 500 Internal Server Error by correctly passing `supabase` client to `getOrCreateCustomerId`.
- **Client Component (`StripePaymentForm.tsx`)**:
  - Removed unused `returnUrl` prop.
  - Removed unused `AlertCircle` import.

### Added
- Detailed logging within webhook handlers (`handleCheckoutSessionCompleted`, `handleInvoicePaymentSucceeded`) for easier debugging.
- Integrated Supabase CLI database dump commands into `backup.sh` script.
- Consolidated master database schema (`consolidated_prod_schema.sql`) including all functions, triggers, and updated annual plan details.

## [1.0.0] - YYYY-MM-DD (Railway Deployment Migration)
### Changed
- **Deployment Architecture:** Migrated entire application (frontend and backend) to Railway.
  - Frontend (`client/`) is now built via Docker (`client/Dockerfile`) and served by Nginx (`client/nginx.conf`) as a separate Railway service.
  - Backend (`server/`) runs as a second Railway service (likely using Nixpacks or optionally Docker).
  - Consolidated deployment aims to resolve previous CORS/CSRF complexities encountered with Vercel/Railway split deployment.
- **Development Environment:** Aligned local development ports with Railway's internal ports (Client: 80, Server: 8080) for consistency.
- **CORS Configuration (`server/server.ts`):** Refactored `allowedOrigins` logic to strictly separate production and development origins. Added `http://localhost` as an allowed origin for development.
- **CSRF Configuration (`server/server.ts`):** Modified Double Submit Cookie middleware to ensure the `X-CSRF-Token-Value` response header is sent on *every* response, not just the initial one, fixing token capture issues in the frontend.
- **Frontend API Client (`client/src/lib/apiClient.ts`):**
  - Updated to use `VITE_API_BASE_URL` environment variable consistently.
  - Added enhanced logging for CSRF token capture.
- **DNS Configuration:** Utilized Cloudflare for DNS management to enable CNAME flattening for the root domain, allowing it to point to the Railway frontend service.

### Added
- `client/Dockerfile`: For building and serving the frontend React application on Railway.
- `client/nginx.conf`: Nginx configuration to serve static frontend assets and handle client-side routing.

### Fixed
- Cross-Origin Resource Sharing (CORS) errors in local development and potentially production by correcting backend allowed origins configuration.
- Cross-Site Request Forgery (CSRF) validation failures (403 Forbidden) on state-changing requests (e.g., PUT/POST) by ensuring the backend consistently provides the necessary token header to the frontend.


## [0.8.1] - YYYY-MM-DD (Post-Deployment Fixes)
### Fixed
- **502 Bad Gateway Error:** Resolved issue caused by Railway routing traffic to the wrong internal port (3001 instead of 8080). Corrected Railway service's exposed port setting to 8080.
- **CSRF Protection Failure (403 Forbidden):** Implemented Double Submit Cookie CSRF strategy using an HttpOnly cookie and custom headers (`X-CSRF-Token-Value`, `X-CSRF-Token-Header`) to reliably handle cross-origin/cross-subdomain requests between Vercel frontend and Railway backend. Updated CORS configuration to expose the necessary header.
- **Maintenance Mode Check:** Replaced insecure direct database query from `AuthProvider` with a secure backend API endpoint (`/api/config/public`) to fetch maintenance status.
- **Search Function Not Found:** Added missing `search_content` SQL function definition to the production database schema.
- **404 Error for `/api/config/public`:** Corrected route mounting order in `server/server.ts` to ensure the specific `/api/config` router is mounted before the general `/api` router.

### Changed
- Updated CSRF middleware in `server/server.ts`.
- Updated Axios interceptors in `client/src/lib/apiClient.ts` for new CSRF pattern.
- Updated `client/src/lib/auth.tsx` to fetch maintenance status from API.

## [0.8.0] - YYYY-MM-DD (Deployment Prep)
### Added
- Consolidated production database schema script.
- `plans` table for Stripe plan details.
- `subscriptions` table links to `plans` via `plan_id`.
- Standardized RLS policies using `is_admin_by_email()` and service role checks.
- Backend API endpoints for Admin features:
  - `GET /api/admin/users`: Fetch list of all users.
  - `GET /api/admin/dashboard-metrics`: Fetch dashboard statistics.
  - `PUT /api/admin/config/maintenance`: Toggle maintenance mode.
  - `GET /api/admin/backup/content`: Trigger content backup download.

### Changed
- Simplified `profiles` table schema (removed role, subscription data, login tracking).
- Refactored client-side Stripe API calls into `client/src/api/subscription.ts`.
- Updated annual plan price to $44.99 and associated Stripe IDs.
- Updated price displays on Landing Page and Account Page.
- Corrected `cancel_url` in Stripe Checkout session creation to point back to `/account`.
- Refactored Admin Users page (`client/.../admin/Users.tsx`) to fetch data from `/api/admin/users`.
- Refactored Admin Dashboard page (`client/.../admin/Dashboard.tsx`) to fetch data and perform actions via backend API endpoints instead of direct client-side Supabase calls.
- Refactored `supabase` client usage in server utility files (`auth-utils`, `subscription-utils`) to use dependency injection, resolving build errors.

### Removed
// ... existing removed items ...

### Fixed
// ... existing fixed items ...
- Admin Users page showing only one user due to missing backend implementation.
- Admin Dashboard displaying incorrect metrics due to client-side fetching limitations.
- Admin check logic in API routes to use authenticated user email instead of potentially unreliable DB function call.

## [0.7.10] - YYYY-MM-DD
### Fixed
- Contact form functionality by correcting API endpoint URL mismatch between client and server (`/contact` vs `/api/contact`).
- Server-side contact form logic to correctly load OAuth credentials from `.env` file (added `dotenv` configuration).
- Server-side contact form logic to attempt sending email when OAuth credentials are present, removing development-specific flags.
- Corrected environment variable checks in `hasOAuthConfig` function to include all required variables (`ADMIN_SENDER_EMAIL`, `ADMIN_RECIPIENT_EMAIL`).

### Added
- Required `ADMIN_RECIPIENT_EMAIL` environment variable for contact form recipient.

## [0.7.9] - YYYY-MM-DD
### Fixed
- User profile update validation logic (handling null/empty nickname, enforcing required fields).
- Sign-in/sign-out state synchronization issue by restoring global `onAuthStateChange` listener to `AuthProvider`.
- `isAdmin` logic in `AuthProvider` to use hardcoded email check, removing failing API calls.
- Positioning of success/error alerts on Account page forms.
- Addressed WebSocket connection errors on static pages by ensuring listener cleanup.
- Resolved Maintenance Mode requiring two reloads to take effect.

### Added
- Backend search functionality (`GET /api/search`) using Supabase SQL function `search_content`.
- Frontend search UI with debouncing on `DashboardPage.tsx`.
- Backend API endpoint for saving user preferences (`PUT /api/user/preferences`).
- Realtime subscription in `AuthProvider` for immediate Maintenance Mode updates.

### Changed
- Optimized Admin Settings save functionality to only update modified settings in the database.

## [0.7.8] - YYYY-MM-DD 
### Fixed
- Resolved 404 errors for fetching single modules by adding `/api/modules/:id` route.
- Resolved 404 errors for fetching bookmarks by adding `/api/bookmarks` endpoint.
- Fixed `/api/sections` endpoint to correctly filter by `module_id` query parameter.
- Fixed `400 Bad Request` for `/api/user/progress` by correcting parameter mismatch and implementing logic.
- Fixed `401 Unauthorized` errors by implementing and applying shared authentication middleware.
- Corrected state management bug in Admin Content sidebar causing incorrect section display.
- Corrected access control logic to ensure Module 1 (index 1) is accessible on the free tier.
- Fixed JSX syntax error in Dashboard page.
- Fixed user profile update validation logic (handling null/empty nickname, enforcing required fields).
- Fixed sign-in/sign-out state synchronization issue by restoring global `onAuthStateChange` listener to `AuthProvider`.
- Simplified `isAdmin` logic in `AuthProvider` to use hardcoded email check, removing failing API calls.
- Improved positioning of success/error alerts on Account page forms.
- Addressed WebSocket connection errors on static pages by ensuring listener cleanup (Note: WebSocket connection attempts on static pages in dev may still occur but shouldn't break functionality).

### Added
- Shared authentication middleware (`server/middleware/auth.ts`).
- Bookmarks API endpoint (`GET` and `POST` on `/api/bookmarks`).
- Dynamic document title updates for most pages.
- Pagination controls at the top of the Admin Content module list.
- Backend search functionality (`GET /api/search`) using Supabase SQL function `search_content`.
- Frontend search UI with debouncing on `DashboardPage.tsx`.
- Backend API endpoint for saving user preferences (`PUT /api/user/preferences`).

### Changed
- Refactored `/api/user/progress` to fetch all user progress by default.
- Refactored authentication logic in `api/user.ts` and `api/bookmarks.ts` to use shared middleware.
- Updated subscription display on Account page to show current tier and correct pricing.
- Implemented subscription-based access control (Module 1 free).
- Optimized Admin Content section list by removing content preview and fetching on edit.
- Updated Admin Content module pagination page size to 10.
- Removed debug/info console logging from server and client.

## [0.7.7] - 2025-04-07
### Added
- API proxy solution to replace Supabase Edge Functions
- Standardized error handling for all API endpoints
- Improved subscription management with Stripe integration
- UUID-based plan identification with plan_type field
- Policy existence checks in database schema
- Enhanced webhook handling for Stripe events
- Comprehensive documentation for API and database setup 

### Added
- Backend API routes (`/api/user/profile`, `/api/user/password`, `/api/user/subscription`) for managing user account details.
- Server-side authentication middleware using JWT verification via Supabase.
- Centralized error handling utility (`handleSupabaseError`) for backend API responses.
- Database trigger (`handle_auth_events`) and function (`record_security_event`) for logging security-related events (signups, password/email changes) to `security_events` table.

### Changed
- Refactored `AccountPage.tsx` to integrate with new backend API endpoints for profile, password, and subscription management.
- Modified `handle_auth_events` trigger function to explicitly qualify function calls (`public.record_security_event`) to prevent function resolution errors (42883).
- Added client-side session refresh (`supabase.auth.refreshSession()`) after successful password updates in `AccountPage.tsx` to prevent subsequent logout failures.

### Fixed
- Persistent `500 Internal Server Error` during password updates, traced to failures within the `handle_auth_events` database trigger.
- Issue where logout would fail (`403 Forbidden`) immediately after a successful password change due to stale client-side session information.

## [0.7.5] - 2025-05-15
### Added
- API proxy solution to replace Supabase Edge Functions
- Standardized error handling for all API endpoints
- Improved subscription management with Stripe integration
- UUID-based plan identification with plan_type field
- Policy existence checks in database schema
- Enhanced webhook handling for Stripe events
- Comprehensive documentation for API and database setup

### Changed
- Reorganized SQL scripts with numerical prefixes
- Updated database schema to use proper UUID for plan IDs
- Improved authentication flow for API endpoints
- Enhanced error responses with proper HTTP status codes

### Fixed
- CORS issues with Edge Functions
- UUID handling for plan IDs to prevent database errors
- Webhook processing for subscription events
- Error handling and response formatting

## [0.7.0] - 2025-05-10
### Added
- Comprehensive content backup and restore functionality
- Full course content backup (all modules and sections)
- Granular module-specific and section-specific backup options
- Intelligent section restoration that checks for existing modules
- Improved API reliability for admin operations
- Fallback mechanisms for data retrieval
- Enhanced server configuration for better security and reliability

## [0.7.0] - 2025-05-01
### Added
- Module duplication functionality
- Section duplication functionality
- "Last Updated" timestamps for all content
- Enhanced permissions checking for admin functions
- Improved content listing and navigation

## [0.7.0] - 2025-04-20
### Added
- Bookmarking functionality
- Improved progress tracking calculations
- Enhanced dashboard to show bookmarked content
- Quick bookmark toggle in content pages
- Updated database schema and API endpoints

## [0.7.0] - 2025-04-15
### Added
- Advanced Settings page for platform configuration
- Database backup functionality
- Maintenance mode for site-wide access control
- System configuration storage
- Enhanced admin dashboard with quick settings access

## [0.6.0] - 2025-04-10
### Added
- Media embedding support for images and videos
- Supabase Storage bucket for course media
- Course authoring guide documentation
- Installation of rehype-raw for HTML content in markdown
- User bookmarking system to remember last viewed position
- Table of Contents sidebar for easy section navigation
- Direct section navigation from dashboard
- Jump to specific sections without completing previous ones
- Enhanced progress tracking based on both module and section completion

### In Progress
- Production deployment configuration
- Vercel integration setup
- Live Stripe webhook endpoints
- Error logging and monitoring
- Analytics integration
- Content version history tracking
- Publishing workflow for content

## [0.5.0] - 2025-04-01
### Added
- Stripe payment processing integration
- Subscription plans and tier management
- Supabase Edge Functions for Stripe API integration
- Stripe Checkout integration for secure payments
- Customer Portal for subscription management
- Enhanced account page with subscription details
- Subscription status indicators
- Database tables for payments and subscriptions
- Free user access restrictions to premium content
- Module access control based on subscription tier

### Changed
- Improved plan tier visualization
- Enhanced subscription status indicators
- Updated navigation for account management

### Fixed
- Subscription tier access restrictions
- Error handling for payments
- Webhook processing for subscription events

## [0.4.0] - 2025-03-20
### Added
- Hierarchical navigation system
- Dedicated module editor page
- Dedicated section editor page
- Advanced search functionality
- Pagination for content lists
- Bulk operations for content management
- Sorting options for admin content views

### Changed
- Improved admin dashboard metrics
- Enhanced content organization
- Optimized database queries

### Fixed
- Database permissions for content access
- Admin authentication issues
- Content update validation

## [0.3.0] - 2025-03-10
### Added
- Comprehensive admin dashboard
- User management system
- Role-based access control
- Course content management
- Analytics dashboard
- User progress tracking
- System settings configuration

### Changed
- Enhanced security measures
- Improved user experience
- Optimized database structure

### Fixed
- Authentication edge cases
- Data consistency issues

## [0.2.4] - 2025-03-05
### Added
- Accessibility improvements
- User preferences

## [0.2.3] - 2025-03-01
### Added
- Enhanced security measures
- Database security improvements

## [0.2.2] - 2025-02-25
### Fixed
- Dark mode navbar visibility
- Avatar color picker functionality

## [0.2.0] - 2025-02-15
### Added
- Supabase authentication integration
- User profile management
- Theme switcher (light/dark mode)
- Basic dashboard layout



