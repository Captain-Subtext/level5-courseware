# Cursor for Non-Coders - Enhancement Roadmap

This document tracks planned enhancements and features for the Cursor for Non-Coders platform, organized by category and target version.

## User Experience & UI (v0.2.1)

- [x] **Theme System**
  - [x] Implement light/dark mode with ThemeContext
  - [x] Add theme toggle in navbar and preferences
  - [x] Persist theme preference in localStorage
  - [x] System preference detection 
  - [x] **Ensure theme consistency across all authenticated pages**

- [x] **Responsive Design**
  - [x] Fix form field responsiveness issues 
  - [x] Improve mobile navigation experience
  - [x] Fix autocomplete attribute warnings on form elements

- [x] **Accessibility**
  - [x] Add proper ARIA attributes to all interactive elements
  - [x] Ensure keyboard navigation works throughout the application

## User Profile & Account (v0.2.1)

- [x] **Profile Enhancements**
  - [x] Add first/last name fields separate from full name
  - [x] Add nickname/display name option
  - [x] Add form validation for all profile fields
  - [x] Fix account settings form errors
  - [x] **Enhance avatar color selection to be more prominent and visible**
  - [x] **Improve account page layout to reduce dead space**

- [x] **Profile Customization**
  - [x] Implement color selection for user avatars
  - [x] Add preset mood colors or color picker
  - [x] Generate avatar based on initials and selected color

- [x] **User Preferences**
  - [x] Email notification settings
  - [x] Persist preferences in user profile

## Learning Experience (v0.2.2)

- [x] **Progress Tracking**
  - [x] Track and persist user progress through course content
  - [x] Add visual progress indicators for modules and sections
  - [x] Implement "continue where you left off" functionality

- [x] **Content Navigation**
  - [x] Improve module and section navigation
  - [x] Add breadcrumbs for better orientation
  - [x] Implement better search across all course content
  - [x] Add bookmarking functionality

## Authentication & Security (v0.2.2)

- [ ] **Authentication Enhancements**
  - [x] Add OAuth providers in production (Google, GitHub)
  - [x] Implement JWT refresh tokens
  - [x] Add password strength meter when changing passwords
  - [x] Add visual email verification status indicators


- [x] **Security Improvements**
  - [x] Implement proper security headers
  - [x] Add rate limiting for authentication attempts
  - [x] Review and enhance Row Level Security policies
  - [x] Implement CSRF protection

## Admin Features (v0.3.0)

- [x] **Admin Dashboard**
  - [x] Create admin dashboard with user metrics
  - [x] Add user management capabilities
  - [x] Implement content management system
  - [x] Add analytics dashboard
  - [x] **Remove or update the "Free Plan" label for appropriate subscription tiers**


- [ ] **Content Management System**
  - [x] **Set up basic content management framework**
  - [x] **Implement pagination for better content organization**
  - [x] **Add search and filtering capabilities**
  - [x] **Create hierarchical navigation for better content organization**
  - [x] **Implement dedicated module and section editor pages**
  - [x] **Add rich text editor with Markdown support and preview**
  - [x] **Implement version history for content changes**
  - [x] **Add support for multimedia content (images, videos, etc.)**
  - [x] **Create content templates for consistent formatting**
  - [x] **Add media embedding capability for TikTok, YouTube, etc.**
  - [x] **Implement image upload with Supabase storage**
  - [x] **Add content duplication feature**
  - [x] Add support for embedding audio files via HTML `<audio>` tags

## Payment & Subscription (v0.5.0)

- [x] **Stripe Integration**
  - [x] Implement Stripe payment processing
  - [x] Create subscription plans and tiers
  - [x] Add payment history in account section
  - [x] Implement subscription management UI

- [ ] **Billing Features**
  - [x] Generate and send invoices

## API & Backend (v0.7.5)

- [x] **API Proxy Solution**
  - [x] Create API router for handling all requests
  - [x] Implement standardized error handling
  - [x] Add authentication verification for API endpoints
  - [x] Develop subscription management endpoints
  - [x] Create webhook handler for Stripe events

- [x] **Database Enhancements**
  - [x] Improve UUID handling for plan IDs
  - [x] Implement policy existence checks to prevent SQL errors
  - [x] Add helper functions for common operations
  - [x] Organize SQL scripts with numerical prefixes

- [x] **Deployment Improvements**
  - [x] Configure Vercel for production deployment
  - [x] Set up proper environment variables
  - [x] Implement maintenance mode detection
  - [x] Add error logging and monitoring
  - [x] Create webhook endpoints for Stripe

## Community & Engagement (v0.3.1)

- [x] **Communication**
  - [x] Email newsletter integration
  - [x] Course update notifications
  - [x] New content alerts
  - [x] Contact form with email functionality

## Performance & Technical (Ongoing)

- [x] **Performance Optimizations**
  - [x] Implement user data caching
  - [x] Optimize database queries
  - [x] Add proper loading states throughout application
  - [x] Improve initial page load performance
  - [x] Optimize token refresh and network activity

- [x] **Technical Improvements**
  - [x] Implement CI/CD pipeline
  - [x] Add error tracking system
  - [x] Implement logging system
  - [x] Implement comprehensive error boundaries
  - [x] Create robust form validation throughout the application

## Notifications & Email System (v1.1.0)

- [ ] **Brevo Integration**
  - [x] Configure Brevo API for transactional emails
  - [x] Set up SMTP integration with Supabase auth emails
  - [x] **New User Sync with Brevo**
    ```typescript
    // Implement webhook on user registration:
    async function syncUserToBrevo(user) {
      const { email, id } = user;
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, nickname')
        .eq('id', id)
        .single();
      
      const name = profile?.full_name || profile?.nickname || email.split('@')[0];
      
      // Use Brevo SDK to add contact
      const apiInstance = new Brevo.ContactsApi();
      apiInstance.setApiKey(Brevo.ContactsApiApiKeys.apiKey, process.env.BREVO_API_KEY);
      
      const createContact = {
        email,
        attributes: {
          FIRSTNAME: name.split(' ')[0],
          LASTNAME: name.split(' ').slice(1).join(' ') || '',
        },
        listIds: [3], // Replace with actual Brevo list ID
        updateEnabled: true
      };
      
      await apiInstance.createContact(createContact);
    }
    ```
  - [ ] **Admin Brevo Sync Function**
    - [ ] Add UI button in admin panel to trigger manual sync
    - [ ] Create endpoint to generate and export contact list

- [ ] **Content Update Notifications**
  - [ ] **Weekly Digest System**
    ```sql
    -- Create content_changes tracking table
    CREATE TABLE IF NOT EXISTS public.content_changes (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      type TEXT NOT NULL, -- 'module_created', 'section_updated', etc.
      entity_id UUID NOT NULL, -- module_id or section_id 
      title TEXT NOT NULL,
      description TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
    );
    
    -- Create triggers to track changes
    CREATE OR REPLACE FUNCTION track_module_changes()
    RETURNS TRIGGER AS $$
    BEGIN
      IF TG_OP = 'INSERT' THEN
        INSERT INTO public.content_changes (type, entity_id, title, description)
        VALUES ('module_created', NEW.id, NEW.title, 'New module added');
      ELSIF TG_OP = 'UPDATE' AND (OLD.title <> NEW.title OR OLD.description <> NEW.description) THEN
        INSERT INTO public.content_changes (type, entity_id, title, description)
        VALUES ('module_updated', NEW.id, NEW.title, 'Module content updated');
      END IF;
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
    
    CREATE TRIGGER track_module_changes
    AFTER INSERT OR UPDATE ON public.modules
    FOR EACH ROW EXECUTE FUNCTION track_module_changes();
    ```
  - [ ] **Weekly Email Generator**
    ```typescript
    async function sendWeeklyContentDigest() {
      // Get changes from the last 7 days
      const { data: changes } = await supabase
        .from('content_changes')
        .select('*')
        .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());
      
      if (!changes || changes.length === 0) {
        console.log('No content changes to report');
        return;
      }
    
      // Group changes by type
      const moduleChanges = changes.filter(c => c.type.includes('module'));
      const sectionChanges = changes.filter(c => c.type.includes('section'));
      
      // Format email content
      const htmlContent = `
        <h2>Weekly Content Update</h2>
        <p>Here's what's new in your Courseware platform this week:</p>
        
        ${moduleChanges.length > 0 ? `
          <h3>Module Updates</h3>
          <ul>
            ${moduleChanges.map(m => `<li><strong>${m.title}</strong>: ${m.description}</li>`).join('')}
          </ul>
        ` : ''}
        
        ${sectionChanges.length > 0 ? `
          <h3>Section Updates</h3>
          <ul>
            ${sectionChanges.map(s => `<li><strong>${s.title}</strong>: ${s.description}</li>`).join('')}
          </ul>
        ` : ''}
        
        <p>Log in to <a href="https://your-app.com">Courseware Platform</a> to check them out!</p>
      `;
      
      // Send using the notification service
      await notificationService.sendNewContentNotification(
        "Your Weekly Cursor Learning Update",
        htmlContent
      );
      
      // Optionally clear processed changes
      await supabase
        .from('content_changes')
        .delete()
        .lte('created_at', new Date().toISOString());
    }
    ```
  - [ ] Set up cron job or scheduled function to run weekly digest

- [ ] **Account Security Notifications**
  - [ ] **Password Change Alerts**
    ```typescript
    async function notifyUserOfPasswordChange(userId, email) {
      const htmlContent = `
        <h2>Password Changed</h2>
        <p>Your password was recently changed on your Courseware Platform account.</p>
        <p>If you made this change, no further action is needed.</p>
        <p>If you did not change your password, please contact support immediately.</p>
      `;
      
      // Use emailBrevoService directly for immediate security notifications
      await emailBrevoService.sendTransactionalEmail({
        to: [{ email }],
        subject: "Password Changed - Courseware Platform",
        htmlContent
      });
    }
    ```
  - [ ] **New Device Login Detection**
    ```typescript
    // Client-side device tracking
    function trackDeviceLogin(user) {
      const currentDevice = getBrowserInfo(); // Helper to get browser/OS info
      
      // Store in localStorage to compare on future logins
      const knownDevices = JSON.parse(localStorage.getItem('knownDevices') || '[]');
      const isNewDevice = !knownDevices.some(device => 
        device.browser === currentDevice.browser && 
        device.os === currentDevice.os
      );
      
      if (isNewDevice) {
        knownDevices.push({
          ...currentDevice,
          firstSeen: new Date().toISOString()
        });
        localStorage.setItem('knownDevices', JSON.stringify(knownDevices));
        
        // Notify about new device login
        apiClient.post('/api/user/notify-login', { 
          deviceInfo: currentDevice 
        });
      }
    }
    
    // Server-side notification
    router.post('/notify-login', isAuthenticated, async (req, res) => {
      const userId = req.user?.id;
      const { deviceInfo } = req.body;
      
      // Get user email and send notification if preferences allow
      const { data: userData } = await supabase.auth.admin.getUserById(userId);
      const email = userData?.user?.email;
      
      // Check preferences and send email if enabled
      const { data: profile } = await supabase
        .from('profiles')
        .select('email_preferences')
        .eq('id', userId)
        .single();
      
      if (profile?.email_preferences?.accountChanges) {
        const htmlContent = `
          <h2>New Device Login</h2>
          <p>We detected a login from a new device on your Courseware Platform account.</p>
          <p><strong>Device Details:</strong></p>
          <ul>
            <li>Browser: ${deviceInfo.browser}</li>
            <li>Operating System: ${deviceInfo.os}</li>
            <li>Time: ${new Date().toLocaleString()}</li>
          </ul>
          <p>If this was you, no action is needed. If you don't recognize this activity, please change your password immediately.</p>
        `;
        
        await emailBrevoService.sendTransactionalEmail({
          to: [{ email }],
          subject: "New Device Login - Courseware Platform",
          htmlContent
        });
      }
      
      res.status(200).json({ success: true });
    });
    ```

- [ ] **Marketing Communication**
  - [ ] Configure Brevo campaign templates
  - [ ] Set up scheduled marketing campaigns in Brevo
  - [ ] **Programmatic Marketing Email Function**
    ```typescript
    // For use by admins to send announcements
    async function sendMarketingAnnouncement(subject, htmlContent) {
      // Query users who have opted in to marketing
      const { data: users, error } = await supabase
        .from('profiles')
        .select('email, full_name, nickname')
        .eq('email_preferences->marketing', 'true')
        .join('auth.users', 'profiles.id = auth.users.id');
        
      if (error || !users || users.length === 0) {
        console.log('No users opted-in for marketing');
        return;
      }
      
      const recipients = users.map(user => ({ 
        email: user.email,
        name: user.nickname || user.full_name || undefined
      }));
      
      // Send via Brevo
      return await emailBrevoService.sendTransactionalEmail({
        to: recipients,
        subject,
        htmlContent
      });
    }
    ```
  - [ ] Add admin UI for composing and sending marketing emails

## Completed Items

- [x] Create reusable Navbar component with mobile responsiveness
- [x] Create Footer component
- [x] Add smooth scrolling for navigation
- [x] Set up basic page routing (React Router)
- [x] Create Privacy Policy page
- [x] Create Terms of Service page
- [x] Implement Supabase authentication with email/password
- [x] Create protected routes requiring authentication
- [x] Set up database schema with profiles, modules, sections, and user_progress
- [x] Add Row Level Security policies for data protection
- [x] Implement account management page
- [x] Create dashboard with course content
- [x] Set up user progress tracking infrastructure
- [x] Ensure theme consistency across all authenticated pages
- [x] Enhance avatar color selection to be more prominent and visible
- [x] Remove or update the "Free Plan" label for appropriate subscription tiers
- [x] Implement comprehensive security measures with Helmet and CSRF protection
- [x] Add rate limiting for authentication attempts
- [x] Create security logging and monitoring system
- [x] Implement contact form with email delivery via Google OAuth
- [x] Add robust fallback for contact form in development environment
- [x] Implement light/dark mode theme system with localStorage persistence
- [x] Add comprehensive user profile management with field validation
- [x] Create avatar customization with color selection
- [x] Implement progress tracking with visual indicators
- [x] Add improved module and section navigation with breadcrumbs
- [x] Optimize token refresh and network activity to reduce console noise
- [x] Implement comprehensive error boundaries and form validation
- [x] **Payment & Subscription System**
  - [x] Implement Stripe payment processing
  - [x] Create subscription plans and tiers
  - [x] Add payment history tracking in database
  - [x] Implement subscription management UI
  - [x] Set up webhooks for payment events
  - [x] Implement secure payment flows
- [x] **Bookmarking & Navigation**
  - [x] Implement user position bookmarking system
  - [x] Add table of contents for easy section navigation
  - [x] Enable direct section access from dashboard
  - [x] Enhance progress tracking to include module and section completion
  - [x] Support non-linear learning paths
- [x] **API Proxy Solution**
  - [x] Replace Supabase Edge Functions with API proxy
  - [x] Create standardized error handling utilities
  - [x] Implement subscription management endpoints
  - [x] Handle Stripe webhooks for subscription events
  - [x] Add proper authentication verification

## Completed Enhancements

- [x] Implement maintenance mode
- [x] Add "Last Updated" timestamp to module and section pages
- [x] Content duplication (clone modules and sections)
- [x] Create advanced settings page for admins
- [x] Add user progress tracking for each course module
- [x] Add bookmarking functionality for users
- [x] Add comprehensive content backup and restore functionality
- [x] Implement API proxy solution to replace Supabase Edge Functions
- [x] Enhance database schema with proper UUID handling and plan_type field

## Addtional Enhancements

- [x] Add version history for content changes
- [x] Implement content search functionality
- [x] Add user activity logging
- [x] Create a notification system for new content
- [x] Enable markdown or rich text formatting for section content


