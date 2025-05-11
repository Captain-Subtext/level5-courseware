import { Request, Response, NextFunction } from 'express';
// Import Supabase User type
import { User } from '@supabase/supabase-js';
const express = require('express');
const router = express.Router();

// Use require() with corrected relative paths
const { supabase } = require('../src/lib/supabase');
// Remove require for non-existent notifications file
// const { NotificationType } = require('../src/lib/notifications'); 
const { sendContactEmail } = require('../src/lib/emailService');
const emailBrevoService = require('../src/lib/emailBrevoService');
// Import error handler and auth middleware
const { handleSupabaseError } = require('./error-utils'); 
const { isAuthenticated } = require('../middleware/auth'); 

// Admin check middleware
const isAdmin = async (req: Request, res: Response, next: NextFunction) => {
  const userEmail = req.user?.email;
  
  if (!userEmail) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  // Hard-coded admin check for simplicity and reliability
  if (userEmail === process.env.ADMIN_EMAIL) {
    return next();
  }
  
  return res.status(403).json({ error: 'Forbidden: Admin access required' });
};

// Define interface for request body
// Use string for notificationType key, assuming keys of NotificationType object are passed
interface AdminBulkEmailRequest {
  notificationType: string; 
  subject: string;
  message: string;
  adminEmail: string; // For verification
  adminSecret: string; // For verification
}

// --- HELPER FUNCTION FOR LOGGING (Keep near top or in a utils file) ---
// Extracted helper function to avoid repetition
async function recordAdminAction(adminUserId: string, eventType: string, details: object, ipAddress?: string) {
  try {
    // Call the SQL function directly using rpc
    const { error: logError } = await supabase.rpc('record_security_event', {
      p_event_type: eventType,
      p_user_id: adminUserId, // Log the admin user who performed the action
      p_details: details,
      p_severity: 'info', // Or adjust severity if needed
      p_ip_address: ipAddress || null // Pass IP if available
    });

    if (logError) {
      console.warn(`Failed to record security event '${eventType}' for admin ${adminUserId}:`, logError.message);
    }
  } catch (rpcError) {
    console.warn(`Exception calling record_security_event RPC for '${eventType}':`, rpcError);
  }
}
// --- END HELPER FUNCTION ---

/**
 * Verify admin credentials (internal helper)
 */
async function verifyAdminCredentials(email: string, secret: string): Promise<boolean> {
  // Use process.env for server-side secrets
  const adminEmail = process.env.ADMIN_EMAIL || "admin@example.com"; // Use env var or default
  const adminSecret = process.env.ADMIN_SECRET; // Should be set in .env
  
  if (!adminSecret) {
    console.error('ADMIN_SECRET environment variable is not set!');
    return false;
  }
  
  // Simple check - enhance security if needed (e.g., hashed secrets)
  return email === adminEmail && secret === adminSecret;
}

// GET /api/admin/users - Fetch list of all users
router.get('/users', isAuthenticated, async (req: Request, res: Response, next: NextFunction) => {
  // Simpler Admin Check: Use email from authenticated user attached by middleware
  const adminEmail = process.env.ADMIN_EMAIL || "admin@example.com"; // Use env var or default
  // Ensure req.user and req.user.email exist (should be guaranteed by isAuthenticated)
  if (req.user?.email !== adminEmail) {
    console.warn(`Admin access denied for user: ${req.user?.email}`);
    return res.status(403).json({ error: 'Forbidden: Admin access required' });
  }
  
  try {
    // Fetch users from Supabase Auth Admin API
    const { data: { users: authUsers }, error: listUsersError } = await supabase.auth.admin.listUsers({
      page: 1,
      perPage: 1000, 
    });

    if (listUsersError) {
      throw listUsersError; // Let the error handler manage Supabase errors
    }

    if (!authUsers || authUsers.length === 0) {
      return res.json({ users: [], total: 0 });
    }

    // Extract user IDs to fetch corresponding profiles and subscriptions
    const userIds = authUsers.map((u: User) => u.id);

    // Fetch email_preferences from profiles for these users
    const { data: profilesData, error: profilesError } = await supabase
      .from('profiles')
      .select('id, email_preferences') // Ensure we select the whole JSONB column
      .in('id', userIds);

    if (profilesError) {
      console.error('Error fetching profiles for admin user list:', profilesError);
      // Proceed without preferences if profile fetch fails, but log the error
    }

    // Create a map for quick lookup: userId -> preferences object
    const preferencesMap = new Map<string, Record<string, boolean>>();
    type ProfileWithPrefs = { id: string; email_preferences?: Record<string, boolean> | null }; // Allow null
    profilesData?.forEach((profile: ProfileWithPrefs) => {
      preferencesMap.set(profile.id, profile.email_preferences || {}); // Use empty object if null/undefined
    });

    // 1. Check for ANY active/trialing subscription to determine premium status
    const { data: activeSubs, error: activeSubError } = await supabase
        .from('subscriptions')
        .select('user_id') // Only need user_id to know who is premium
        .in('user_id', userIds)
        .in('status', ['active', 'trialing']);

    if (activeSubError) {
        console.error("Error fetching active subscriptions:", activeSubError);
        throw activeSubError;
    }
    // Explicitly type 's' to resolve linter error
    const premiumUserIds = new Set(activeSubs?.map((s: { user_id: string }) => s.user_id) || []);

    // 2. Check specifically for ACTIVE MANUAL subscriptions
    const { data: activeManualSubs, error: manualSubError } = await supabase
        .from('subscriptions')
        .select('user_id, id') // Select 'id' instead of 'stripe_subscription_id'
        .in('user_id', userIds)
        .eq('status', 'active') // Only active manual subs matter
        // Check if the primary 'id' starts with 'manual_' OR is the old 'manual' value
        .or(`id.eq.manual,id.like.manual_%`);

    if (manualSubError) {
        console.error('Error fetching active manual subscriptions:', manualSubError);
        throw manualSubError;
    }
    // Explicitly type 's' to resolve linter error
    const manualSubUserIds = new Set(activeManualSubs?.map((s: { user_id: string }) => s.user_id) || []);

    // Combine auth data using the sets and preferences map
    const formattedUsers = authUsers.map((u: User) => {
      const userPrefs = preferencesMap.get(u.id) || {}; // Get preferences or default to empty object
      return {
        id: u.id,
        email: u.email,
        created_at: u.created_at,
        last_sign_in_at: u.last_sign_in_at,
        // Extract specific preferences, defaulting to false if not found
        marketing_preference: userPrefs.marketing ?? false, 
        content_updates_preference: userPrefs.contentUpdates ?? false, 
        account_changes_preference: userPrefs.accountChanges ?? false, 
        is_premium: premiumUserIds.has(u.id), // True if user ID is in the premium set
        is_manual_subscription: manualSubUserIds.has(u.id), // True if user ID is in the active manual set
      };
    });

    // Return the combined list of users and the total count
    res.json({
      users: formattedUsers,
      total: formattedUsers.length 
    });

  } catch (error) {
    console.error('Error fetching users:', error);
    // Use handleSupabaseError, assuming it can format generic errors too
    return res.status(500).json(handleSupabaseError(error, 'Failed to fetch users'));
  }
});

// GET /api/admin/dashboard-metrics - Fetch counts for admin dashboard
router.get('/dashboard-metrics', isAuthenticated, async (req: Request, res: Response, next: NextFunction) => {
  // Verify admin status
  const adminEmail = process.env.ADMIN_EMAIL || "admin@example.com";
  if (req.user?.email !== adminEmail) {
    return res.status(403).json({ error: 'Forbidden: Admin access required' });
  }

  try {
        // 1. Total Users count (Call the dedicated SQL function)
        const { data: totalUsersCount, error: usersError } = await supabase
          .rpc('count_total_users', {}, { count: 'exact' }); // Call the function

        if (usersError) {
            console.error("Error calling count_total_users RPC:", usersError);
            throw usersError; // Rethrow the error
        }
        // Note: RPC count might return the number directly, or in a different structure.
        // Check Supabase docs/logs if needed, but often it's just the number.

    // 2. Active Users (using profiles.updated_at for now, needs refinement)
    // This is an approximation. A better approach might involve tracking last_active in profiles
    // or querying security_events if login events are reliably logged.
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const { count: activeUsersCount, error: activeUsersError } = await supabase
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .gt('updated_at', thirtyDaysAgo.toISOString()); // Approximation
    // Ignore activeUsersError for now, default to 0 if fails
    if (activeUsersError) console.warn('Error fetching active users count:', activeUsersError);

    // 3. Premium Users (from subscriptions table)
    const { count: premiumUsersCount, error: premiumUsersError } = await supabase
      .from('subscriptions')
      .select('id', { count: 'exact', head: true })
      .in('status', ['active', 'trialing']); // Count active/trialing subscriptions
    // Ignore premiumUsersError for now, default to 0 if fails
    if (premiumUsersError) console.warn('Error fetching premium users count:', premiumUsersError);

    // 4. Total Content Items (Modules + Sections)
    const { count: modulesCount, error: modulesError } = await supabase
      .from('modules')
      .select('id', { count: 'exact', head: true });
    if (modulesError) throw modulesError;

    const { count: sectionsCount, error: sectionsError } = await supabase
      .from('sections')
      .select('id', { count: 'exact', head: true });
    if (sectionsError) throw sectionsError;

    res.json({
      totalUsers: totalUsersCount ?? 0,
      activeUsers: activeUsersCount ?? 0,
      premiumUsers: premiumUsersCount ?? 0,
      totalContent: (modulesCount ?? 0) + (sectionsCount ?? 0),
    });

  } catch (error) {
    console.error('Error fetching dashboard metrics:', error);
    return res.status(500).json(handleSupabaseError(error, 'Failed to fetch dashboard metrics'));
  }
});

// PUT /api/admin/config/maintenance - Update maintenance mode
router.put('/config/maintenance', isAuthenticated, async (req: Request, res: Response, next: NextFunction) => {
  const adminUserId = req.user?.id; // Get admin user ID from middleware
  const adminUserEmail = req.user?.email;

  // Verify admin status
  const adminCheckEmail = process.env.ADMIN_EMAIL || "admin@example.com";
  if (adminUserEmail !== adminCheckEmail || !adminUserId) {
    return res.status(403).json({ error: 'Forbidden: Admin access required' });
  }

  const { enable } = req.body; // Expect { enable: boolean }

  if (typeof enable !== 'boolean') {
    return res.status(400).json({ error: 'Invalid request body. Expecting { enable: boolean }.' });
  }

  const newValue = enable ? 'true' : 'false';

  try {
    // Upsert the maintenance_mode key in the config table
    const { error } = await supabase
      .from('config')
      .upsert({ key: 'maintenance_mode', value: newValue }, { onConflict: 'key' });

    if (error) throw error;

    // Log the action AFTER successful DB update
    console.log(`Maintenance mode updated to: ${newValue} by admin ${adminUserEmail}`);
    recordAdminAction(
      adminUserId,
      'maintenance_mode_toggled',
      { enabled: enable },
      req.ip // Pass request IP address if available/desired
    );

    res.status(200).json({ success: true, maintenanceMode: enable });

  } catch (error) {
    console.error('Error updating maintenance mode:', error);
    return res.status(500).json(handleSupabaseError(error, 'Failed to update maintenance mode'));
  }
});

// Define interface for banner config request
interface AdminBannerConfigRequest {
  enabled: boolean;
  text: string;
}

// PUT /api/admin/config/banner - Update announcement banner settings
router.put('/config/banner', isAuthenticated, async (req: Request, res: Response, next: NextFunction) => {
  const adminUserId = req.user?.id; // Get admin user ID
  const adminUserEmail = req.user?.email;

  // Verify admin status
  const adminCheckEmail = process.env.ADMIN_EMAIL || "admin@example.com";
  if (adminUserEmail !== adminCheckEmail || !adminUserId) {
    return res.status(403).json({ error: 'Forbidden: Admin access required' });
  }

  const { enabled, text } = req.body as AdminBannerConfigRequest;

  // Validate input types
  if (typeof enabled !== 'boolean') {
    return res.status(400).json({ error: "Invalid request body. 'enabled' must be a boolean." });
  }
  if (typeof text !== 'string') {
    return res.status(400).json({ error: "Invalid request body. 'text' must be a string." });
  }

  try {
    // Prepare data for upsert
    const bannerUpdates = [
      { key: 'announcement_banner_enabled', value: enabled ? 'true' : 'false' },
      { key: 'announcement_banner_text', value: text },
    ];

    // Upsert both settings in the config table
    const { error } = await supabase
      .from('config')
      .upsert(bannerUpdates, { onConflict: 'key' });

    if (error) throw error;

    // Log the action AFTER successful DB update
    console.log(`Announcement banner settings updated by admin ${adminUserEmail}: Enabled=${enabled}, Text="${text.substring(0, 50)}..."`);
    recordAdminAction(
      adminUserId,
      'banner_settings_updated',
      { enabled: enabled, text_truncated: text.substring(0, 50) + (text.length > 50 ? '...' : '') },
      req.ip // Pass request IP address
    );

    res.status(200).json({ success: true, enabled, text });

  } catch (error) {
    console.error('Error updating announcement banner settings:', error);
    return res.status(500).json(handleSupabaseError(error, 'Failed to update announcement banner settings'));
  }
});

// GET /api/admin/backup/content - Get content backup JSON
router.get('/backup/content', isAuthenticated, async (req: Request, res: Response, next: NextFunction) => {
  // Verify admin status
  const adminEmail = process.env.ADMIN_EMAIL || "admin@example.com";
  if (req.user?.email !== adminEmail) {
    return res.status(403).json({ error: 'Forbidden: Admin access required' });
  }

  try {
    // Call the database function to get the backup data
    const { data: backupData, error } = await supabase.rpc('get_content_backup');

    if (error) throw error;

    if (!backupData) {
      return res.status(404).json({ error: 'No backup data found or function returned null.' });
    }

    // Set headers for file download
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `content-backup-${timestamp}.json`;
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Type', 'application/json');
    
    // Send the backup data
    res.status(200).json(backupData);

  } catch (error) {
    console.error('Error generating content backup:', error);
    return res.status(500).json(handleSupabaseError(error, 'Failed to generate content backup'));
  }
});

// POST /api/admin/bulk-email
router.post('/bulk-email', async (req: Request, res: Response, next: NextFunction) => {
  const { 
    notificationType, 
    subject, 
    message, 
    adminEmail, 
    adminSecret 
  }: AdminBulkEmailRequest = req.body;

  // Basic validation
  if (!notificationType || !subject || !message || !adminEmail || !adminSecret) {
    return res.status(400).json({ success: false, message: 'Missing required fields for bulk email.' });
  }

  try {
    // Verify admin credentials first
    const isAdmin = await verifyAdminCredentials(adminEmail, adminSecret);
    if (!isAdmin) {
      return res.status(403).json({ success: false, message: "Unauthorized. Invalid admin credentials." });
    }
    
    // --- Start of original sendBulkEmail logic --- 
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, email_preferences')
      .not('email_preferences', 'is', null);
      
    if (profilesError) {
      console.error("Error fetching profiles for bulk email:", profilesError);
      // Don't pass DB error directly, send generic message
      return res.status(500).json({ success: false, message: "Failed to fetch user profiles." });
    }
    
    if (!profiles || profiles.length === 0) {
      return res.status(200).json({ success: true, message: "No users found with notification preferences.", stats: { total: 0, sent: 0 } });
    }
    
    // Define profile type explicitly if available, otherwise use any
    // Assuming a Profile type might exist in types.d.ts or similar
    // type Profile = { id: string; email_preferences?: { [key: string]: boolean } };
    // Define a specific type for the profile data fetched
    type ProfileWithPrefs = { id: string; email_preferences?: Record<string, boolean> };

    const eligibleUsers = profiles.filter((profile: ProfileWithPrefs) => {
      if (!profile.email_preferences) return false;
      
      // Check against string keys directly since NotificationType isn't imported
      const checkType = notificationType as keyof typeof profile.email_preferences;

      // Backward compatibility check using string comparison
      if (notificationType === 'contentUpdates') { 
        return (
          profile.email_preferences.contentUpdates || 
          profile.email_preferences.courseUpdates || 
          profile.email_preferences.newContent || 
          false
        );
      }
      // Check the specific key passed in notificationType
      return profile.email_preferences[checkType] || false;
    });
    
    const emailPromises = eligibleUsers.map(async (profile: ProfileWithPrefs) => {
      try {
        // Use service role key for admin operations if needed, or ensure RLS allows fetching emails
        const { data, error } = await supabase.auth.admin.getUserById(profile.id);
        if (error) {
          console.warn(`Failed to get user ${profile.id} for bulk email:`, error.message);
          return null;
        }
        return data?.user?.email;
      } catch (err) {
        console.warn(`Exception getting user ${profile.id} for bulk email:`, err);
        return null;
      }
    });
    
    const emails = (await Promise.all(emailPromises)).filter(Boolean) as string[];
    
    if (emails.length === 0) {
      return res.status(200).json({ success: true, message: "No users found subscribed to this notification type.", stats: { total: 0, sent: 0 } });
    }
    
    let sent = 0;
    // Consider using a proper bulk email service (e.g., SendGrid, Mailgun via API) 
    // instead of sending one by one with sendContactEmail for performance and deliverability.
    for (const email of emails) {
      try {
        // Using sendContactEmail as per original code - might hit rate limits
        const result = await sendContactEmail({
          recipientEmail: email, // Ensure sendContactEmail uses this
          name: "Cursor for Non-Coders",
          email: process.env.ADMIN_SENDER_EMAIL || "admin@example.com", // Use configured sender
          subject: subject,
          message: message // Ensure message is formatted appropriately (HTML?)
        });
        if (result.success) sent++;
      } catch (error) {
        console.error(`Failed to send bulk email to ${email}:`, error);
      }
    }
    // --- End of original sendBulkEmail logic --- 

    res.status(200).json({
      success: true,
      message: `Bulk email process completed. Attempted to send ${sent} out of ${emails.length} eligible emails.`,
      stats: { total: emails.length, sent }
    });

  } catch (error) {
    console.error("Error processing bulk email request:", error);
    // Pass error to central handler
    next(error); 
  }
});

// --- NEW GENERIC SETTINGS ENDPOINT ---
// Define interface for generic settings update request
// Allows an array of key-value pairs
interface AdminSettingsUpdateRequest {
  settings: { key: string; value: string }[];
}

// PUT /api/admin/config/settings - Update multiple general settings
router.put('/config/settings', isAuthenticated, async (req: Request, res: Response, next: NextFunction) => {
  const adminUserId = req.user?.id;
  const adminUserEmail = req.user?.email;

  // Verify admin status
  const adminCheckEmail = process.env.ADMIN_EMAIL || "admin@example.com";
  if (adminUserEmail !== adminCheckEmail || !adminUserId) {
    return res.status(403).json({ error: 'Forbidden: Admin access required' });
  }

  const { settings } = req.body as AdminSettingsUpdateRequest;

  // Validate input
  if (!Array.isArray(settings) || settings.length === 0) {
    return res.status(400).json({ error: "Invalid request body. Expecting { settings: [{ key: string, value: string }] }." });
  }

  // Define allowed keys to prevent arbitrary updates
  const allowedConfigKeys = [
    'site_name',
    'contact_email',
    'enable_notifications',
    'session_timeout',
    'max_login_attempts',
    'enable_logging',
    'default_lang'
  ];

  const updatesToPerform = settings.filter(setting => 
    allowedConfigKeys.includes(setting.key) &&
    typeof setting.key === 'string' && 
    typeof setting.value === 'string' // Basic type check
  );

  if (updatesToPerform.length === 0) {
      return res.status(400).json({ error: "No valid settings provided or none are allowed to be updated via this endpoint." });
  }
  
  // Add updated_at timestamp to each update
  const upsertData = updatesToPerform.map(setting => ({
      ...setting,
      updated_at: new Date().toISOString() 
  }));

  try {
    // Perform batch upsert
    const { error } = await supabase
      .from('config')
      .upsert(upsertData, { onConflict: 'key' });

    if (error) throw error;

    // Log the action AFTER successful DB update
    // Create a summary of changes for logging details
    const changesSummary = updatesToPerform.reduce((acc, setting) => {
        acc[setting.key] = setting.value;
        return acc;
    }, {} as Record<string, string>);

    console.log(`General settings updated by admin ${adminUserEmail}:`, changesSummary);
    recordAdminAction(
      adminUserId,
      'general_settings_updated', // Use a generic event type
      { changes: changesSummary }, // Log the specific changes made
      req.ip 
    );

    // Respond with success and potentially the updated settings map
    res.status(200).json({ 
        success: true, 
        message: 'Settings updated successfully.',
        updatedKeys: updatesToPerform.map(s => s.key) 
    });

  } catch (error) {
    console.error('Error updating general settings:', error);
    return res.status(500).json(handleSupabaseError(error, 'Failed to update settings'));
  }
});
// --- END NEW GENERIC SETTINGS ENDPOINT ---

// POST /api/admin/users/:userId/grant-monthly - Manually grant a monthly subscription
router.post('/users/:userId/grant-monthly', isAuthenticated, async (req: Request, res: Response, next: NextFunction) => {
  const adminUserId = req.user?.id; // Get admin user ID for logging
  const adminUserEmail = req.user?.email;
  const targetUserId = req.params.userId;
  const manualSubscriptionId = `manual_${targetUserId}`; // Generate unique manual ID

  // Verify admin status
  const adminCheckEmail = process.env.ADMIN_EMAIL || "admin@example.com";
  if (adminUserEmail !== adminCheckEmail || !adminUserId) {
    return res.status(403).json({ error: 'Forbidden: Admin access required' });
  }

  if (!targetUserId) {
    return res.status(400).json({ error: 'User ID parameter is missing.' });
  }

  try {
    // Use the check-then-update-or-insert logic

    // 1. Check if user already has an ACTIVE or TRIALING subscription (manual or Stripe)
    const { data: activeSub, error: checkActiveError } = await supabase
      .from('subscriptions')
      .select('id') // Select the 'id' column (which contains Stripe ID or manual_...)
      .eq('user_id', targetUserId)
      .in('status', ['active', 'trialing'])
      .maybeSingle(); 

    if (checkActiveError) {
        console.error(`Error checking for active/trialing subscription for user ${targetUserId}:`, checkActiveError);
        throw checkActiveError;
    }

    if (activeSub) {
        // If the existing active sub IS manual, maybe just confirm it's active?
        // For now, prevent granting if *any* active/trialing sub exists.
        console.warn(`Attempted to grant manual subscription to user ${targetUserId} who already has an active/trialing subscription (ID: ${activeSub.id}).`);
        return res.status(409).json({ error: 'User already has an active or trialing subscription.' });
    }

    // 2. Check if a PREVIOUSLY CANCELED 'manual' subscription exists for this user (using new ID format)
    const { data: canceledManualSub, error: checkCanceledError } = await supabase
      .from('subscriptions')
      .select('id')
      .eq('user_id', targetUserId)
      .eq('status', 'canceled')
      .eq('id', manualSubscriptionId) // Look for the specific manual ID in the 'id' column
      .maybeSingle();
      
    if (checkCanceledError) {
        console.error(`Error checking for canceled manual subscription for user ${targetUserId}:`, checkCanceledError);
        throw checkCanceledError;
    }

    const farFutureDate = new Date();
    farFutureDate.setFullYear(farFutureDate.getFullYear() + 100);

    if (canceledManualSub) {
      // 3a. If found, REACTIVATE the existing canceled manual subscription
      console.log(`Reactivating canceled manual subscription ${canceledManualSub.id} for user ${targetUserId}.`);
      const { error: updateError } = await supabase
        .from('subscriptions')
        .update({
          status: 'active',
          canceled_at: null, 
          current_period_start: new Date().toISOString(),
          current_period_end: farFutureDate.toISOString(), 
        })
        .eq('id', canceledManualSub.id); // Update the specific subscription record
      
      if (updateError) {
          console.error(`Error reactivating subscription ${canceledManualSub.id}:`, updateError);
          throw updateError;
      }

      // Log the reactivation
      recordAdminAction(
        adminUserId,
        'manual_subscription_reactivated', // Specific event type
        { targetUserId: targetUserId, tier: 'monthly', subscriptionId: canceledManualSub.id },
        req.ip
      );

      res.status(200).json({ success: true, message: 'Existing manual monthly subscription reactivated.' });

    } else {
      // 3b. If NO relevant sub found, INSERT a new one with the unique manual ID
      console.log(`Inserting new manual subscription for user ${targetUserId} with ID ${manualSubscriptionId}.`);
      const { error: insertError } = await supabase
        .from('subscriptions')
        .insert({
          user_id: targetUserId,
          status: 'active',
          current_period_start: new Date().toISOString(),
          current_period_end: farFutureDate.toISOString(),
          id: manualSubscriptionId, // Use the unique manual ID for the primary 'id' column
          stripe_customer_id: manualSubscriptionId, // Use unique ID here too, assuming this col exists
          plan_id: null, 
          cancel_at_period_end: false,
          canceled_at: null,
          ended_at: null,
          trial_start: null,
          trial_end: null
        });

      if (insertError) {
          // Check error code for unique constraint on 'id' (primary key)
          if (insertError.code === '23505') { 
              console.error(`Insert failed due to duplicate primary key ID=${manualSubscriptionId} for user ${targetUserId}: ${insertError.message}`);
              return res.status(409).json({ error: 'Conflict: Could not insert manual subscription due to an existing entry with the same generated manual ID (primary key).'});
          } 
          console.error(`Error inserting new manual subscription for user ${targetUserId}:`, insertError);
          throw insertError;
      }

      // Log the initial grant
      recordAdminAction(
        adminUserId,
        'manual_subscription_granted',
        { targetUserId: targetUserId, tier: 'monthly' },
        req.ip
      );

      res.status(200).json({ success: true, message: 'Monthly subscription granted successfully.' });
    }

  } catch (error) {
    console.error(`Error granting monthly subscription to user ${targetUserId}:`, error);
    // Use the central error handler
    return res.status(500).json(handleSupabaseError(error, 'Failed to grant subscription'));
  }
});

// POST /api/admin/users/:userId/revoke-monthly - Manually revoke (cancel) a monthly subscription
router.post('/users/:userId/revoke-monthly', isAuthenticated, async (req: Request, res: Response, next: NextFunction) => {
  const adminUserId = req.user?.id;
  const adminUserEmail = req.user?.email;
  const targetUserId = req.params.userId;
  const manualSubscriptionId = `manual_${targetUserId}`; // Generate unique manual ID to find

  // Verify admin status
  const adminCheckEmail = process.env.ADMIN_EMAIL || "admin@example.com";
  if (adminUserEmail !== adminCheckEmail || !adminUserId) {
    return res.status(403).json({ error: 'Forbidden: Admin access required' });
  }

  if (!targetUserId) {
    return res.status(400).json({ error: 'User ID parameter is missing.' });
  }

  try {
    // Find the active 'manual' subscription for the user using the unique ID in the 'id' column
    const { data: subscription, error: findError } = await supabase
      .from('subscriptions')
      .select('id') 
      .eq('user_id', targetUserId)
      .eq('status', 'active')   
      .eq('id', manualSubscriptionId) // Use the unique manual ID in the 'id' column
      .maybeSingle();

    if (findError) throw findError;

    if (!subscription) {
      return res.status(404).json({ error: 'No active manually granted subscription found for this user to revoke.' });
    }

    // Update the subscription to canceled status
    const { error: updateError } = await supabase
      .from('subscriptions')
      .update({
        status: 'canceled',
        canceled_at: new Date().toISOString(),
      })
      .eq('id', subscription.id); 

    if (updateError) throw updateError;

    // Log the admin action
    recordAdminAction(
      adminUserId,
      'manual_subscription_revoked', // Keep event type specific
      { targetUserId: targetUserId, tier: 'manual' }, // Indicate it was a manual one
      req.ip
    );

    res.status(200).json({ success: true, message: 'Manually granted subscription revoked successfully.' });

  } catch (error) {
    console.error(`Error revoking manual subscription for user ${targetUserId}:`, error);
    return res.status(500).json(handleSupabaseError(error, 'Failed to revoke manual subscription'));
  }
});

/**
 * Sync Users with Brevo
 * This endpoint allows admins to sync users to Brevo based on various filters
 */
router.post('/sync-brevo-contacts', isAuthenticated, isAdmin, async (req: Request, res: Response) => {
  const { filter = 'all', since, listIds = [] } = req.body;
  
  try {
    if (!emailBrevoService || typeof emailBrevoService.syncContactPreferences !== 'function') {
      return res.status(500).json({ error: 'Brevo API not properly configured' });
    }
    
    // Step 1: Fetch profiles
    let profilesQuery = supabase.from('profiles').select('id, full_name, nickname, email_preferences');
    
    // Apply filters if needed
    if (filter === 'new' && since) {
      const sinceDate = new Date(since);
      profilesQuery = profilesQuery.gte('created_at', sinceDate.toISOString());
    } else if (filter === 'new') {
      // Default to last 24 hours
      const sinceDate = new Date(Date.now() - 24 * 60 * 60 * 1000);
      profilesQuery = profilesQuery.gte('created_at', sinceDate.toISOString());
    }
    
    // Execute profiles query
    const { data: profiles, error: profilesError } = await profilesQuery;
    
    if (profilesError) {
      throw profilesError;
    }
    
    if (!profiles || profiles.length === 0) {
      return res.json({ message: 'No profiles found matching the criteria', count: 0 });
    }
    
    // Step 2: For each profile, get the corresponding user email
    const results = [];
    
    for (const profile of profiles) {
      try {
        // Get user email from auth API using the profile ID
        const { data, error: userError } = await supabase.auth.admin.getUserById(profile.id);
        
        if (userError || !data?.user?.email) {
          console.warn(`Could not find user for profile ${profile.id}:`, userError);
          continue;
        }
        
        const email = data.user.email;
        const preferences = profile.email_preferences || {
          contentUpdates: true,
          accountChanges: true,
          marketing: true
        };
        
        // Get name components
        let firstName = '';
        let lastName = '';
        if (profile.full_name) {
          const nameParts = profile.full_name.split(' ');
          firstName = nameParts[0] || '';
          lastName = nameParts.slice(1).join(' ') || '';
        }
        
        // Sync this user to Brevo
        try {
          const syncResult = await emailBrevoService.syncContactPreferences(
            email,
            preferences,
            {
              FIRSTNAME: firstName,
              LASTNAME: lastName,
              NICKNAME: profile.nickname || ''
            }
          );
          
          results.push({
            email,
            success: syncResult.success,
            message: syncResult.message
          });
        } catch (syncError: any) {
          console.error(`Error syncing user ${email} to Brevo:`, syncError);
          results.push({
            email,
            success: false,
            message: syncError.message || 'Unknown error during sync'
          });
        }
      } catch (userError: any) {
        console.error(`Error fetching user for profile ${profile.id}:`, userError);
      }
    }
    
    const successful = results.filter(r => r.success).length;
    
    res.json({
      message: `Synced ${successful} out of ${results.length} users to Brevo`,
      count: results.length,
      successCount: successful,
      results
    });
    
  } catch (error: any) {
    console.error('Error in Brevo sync:', error);
    res.status(500).json({
      error: 'Failed to sync users with Brevo',
      details: error.message
    });
  }
});

module.exports = router;