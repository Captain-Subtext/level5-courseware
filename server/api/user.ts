import { Request, Response, NextFunction } from 'express';

const express = require('express');
const router = express.Router();

// Import server-side Supabase client
const { supabase } = require('../src/lib/supabase');

// Import error handler utility
const { handleSupabaseError } = require('./error-utils');

// Import the shared authentication middleware
const { isAuthenticated } = require('../middleware/auth');

// --- Rate Limiting for Password Update ---
const passwordUpdateAttempts = new Map<string, { count: number, lastAttemptTime: number }>();
const MAX_PASSWORD_UPDATE_ATTEMPTS = 5; // Max 5 attempts
const PASSWORD_UPDATE_WINDOW_MS = 15 * 60 * 1000; // 15 minutes window

function rateLimitPasswordUpdate(req: Request, res: Response, next: NextFunction) {
  // @ts-ignore
  const userId = req.user?.id;

  if (!userId) {
    // Should be caught by isAuthenticated, but as a safeguard
    return res.status(401).json({ error: 'User not authenticated for rate limiting.' });
  }

  const now = Date.now();
  const userAttempts = passwordUpdateAttempts.get(userId);

  if (userAttempts) {
    // If window has passed, reset attempts
    if (now - userAttempts.lastAttemptTime > PASSWORD_UPDATE_WINDOW_MS) {
      passwordUpdateAttempts.set(userId, { count: 1, lastAttemptTime: now });
    } else {
      // If still within window, check attempt count
      if (userAttempts.count >= MAX_PASSWORD_UPDATE_ATTEMPTS) {
        console.warn(`Rate limit exceeded for password update by user ${userId}`);
        return res.status(429).json({ error: 'Too many password update attempts. Please try again later.' });
      }
      // Increment attempts
      userAttempts.count++;
      userAttempts.lastAttemptTime = now; // Update last attempt time to keep window sliding
    }
  } else {
    // First attempt
    passwordUpdateAttempts.set(userId, { count: 1, lastAttemptTime: now });
  }
  next();
}

// Define an interface for the shape of data returned by the progress query
interface ProgressQueryResult {
  section_id: string;
  completed: boolean;
  updated_at: string;
  sections: { module_id: string } | null; // Type for the joined table result
}

// --- Implemented Routes ---

// GET /api/user/profile
// Apply shared middleware directly
router.get('/profile', isAuthenticated, async (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now(); // Record start time
  // @ts-ignore - User is attached by shared isAuthenticated middleware
  const userId = req.user?.id;
  // console.log(`[${new Date().toISOString()}] USER PROFILE START: Handling /api/user/profile for user ${userId}`);

  if (!userId) {
    console.error(`[${new Date().toISOString()}] USER PROFILE ERROR: No user ID found after isAuthenticated middleware.`);
    return res.status(401).json({ error: 'Authentication failed unexpectedly' });
  }

  try {
    // console.log(`[${new Date().toISOString()}] USER PROFILE DB QUERY START: Fetching profile for user ${userId}`);
    const { data: profile, error } = await supabase
      .from('profiles')
      .select(` 
        id,
        full_name,
        nickname,
        avatar_color,
        avatar_url,
        email_preferences
      `) // Ensure backtick closes correctly
      .eq('id', userId)
      .single();
    const queryEndTime = Date.now();
    // console.log(`[${new Date().toISOString()}] USER PROFILE DB QUERY END: Profile query took ${queryEndTime - startTime}ms for user ${userId}. Error: ${error ? JSON.stringify(error) : 'None'}`);

    if (error) {
      if (error.code === 'PGRST116') { 
         console.warn(`[${new Date().toISOString()}] USER PROFILE WARN: Profile not found (404) for user ${userId}`);
         return handleSupabaseError(res, { status: 404, message: 'Profile not found.' });
      }
      // Throw other Supabase errors to be handled below
      console.error(`[${new Date().toISOString()}] USER PROFILE DB ERROR: Supabase error for user ${userId}:`, error);
      throw error; 
    }

    if (!profile) {
       console.error(`[${new Date().toISOString()}] USER PROFILE ERROR: Profile data null despite no DB error for user ${userId}`);
      return handleSupabaseError(res, { status: 404, message: 'Profile data is unexpectedly null.' });
    }
    
    // console.log(`[${new Date().toISOString()}] USER PROFILE SUCCESS: Sending profile data for user ${userId}. Total time: ${Date.now() - startTime}ms`);
    res.json(profile);

  } catch (error) {
    console.error(`[${new Date().toISOString()}] USER PROFILE CATCH ERROR: Catch block error for user ${userId}. Total time: ${Date.now() - startTime}ms`, error);
    // Ensure handleSupabaseError is called correctly
    handleSupabaseError(res, error, 'Failed to fetch user profile');
  }
});

// GET /api/user/subscription
// Apply shared middleware directly
router.get('/subscription', isAuthenticated, async (req: Request, res: Response, next: NextFunction) => {
  // @ts-ignore - User is attached by shared isAuthenticated middleware
  const userId = req.user?.id;

  if (!userId) {
    // Defensive check
     return res.status(401).json({ error: 'Authentication failed unexpectedly' });
  }

  try {
    // Filter for active/trialing subscriptions and order by newest
    const { data: subscriptionData, error: dbError } = await supabase
      .from('subscriptions') 
      .select(`
        id, 
        status,
        current_period_end,
        cancel_at_period_end,
        plan_id,
        plans ( id, name, plan_type )
      `)
      .eq('user_id', userId)
      .in('status', ['active', 'trialing']) // Only get active/trialing
      .order('created_at', { ascending: false }) // Get newest first
      .limit(1); // Get only one record

    if (dbError) {
      console.error(`Error fetching subscription for user ${userId}:`, dbError);
      throw dbError;
    }

    // No subscription or empty array
    if (!subscriptionData || subscriptionData.length === 0) {
      return res.json(null);
    }

    // Get the first (and only due to limit(1)) subscription
    const subscription = subscriptionData[0];

    // Map to client format
    const subscriptionDetails = {
      id: subscription.id,
      status: subscription.status,
      plan_name: subscription.plans?.name || 'Unknown Plan',
      current_period_end: Math.floor(new Date(subscription.current_period_end).getTime() / 1000),
      cancel_at_period_end: subscription.cancel_at_period_end,
    };

    res.json(subscriptionDetails);
  } catch (error) {
    console.error(`Error in subscription endpoint for user ${userId}:`, error);
    handleSupabaseError(res, error, 'Failed to fetch subscription details');
  }
});

// GET /api/user/progress - Fetch ALL progress for the authenticated user
// Apply shared middleware directly
router.get('/progress', isAuthenticated, async (req: Request, res: Response, next: NextFunction) => {
  // @ts-ignore - User is attached by shared isAuthenticated middleware
  const userId = req.user?.id;

  // console.log(`GET /api/user/progress hit for user ${userId}`);

  if (!userId) {
    // Defensive check
    return res.status(401).json({ error: 'Authentication failed unexpectedly' });
  }

  // Remove module_id validation
  /*
  if (!module_id || typeof module_id !== 'string') {
    return res.status(400).json({ error: 'Missing or invalid module_id query parameter.' });
  }
  */

  try {
    // Fetch ALL user progress records for this user
    // Remove the join and module_id filter
    const { data, error, status } = await supabase
      .from('user_progress')
      .select(`
        section_id,
        completed,
        updated_at
      `)
      .eq('user_id', userId);

    if (error) {
      return handleSupabaseError(error, res, next, status);
    }

    // Data is already in the correct format
    const progressData = data || [];

    res.status(200).json(progressData);

  } catch (err) {
    // Update error log context
    console.error(`Unexpected error fetching progress for user ${userId}:`, err);
    next(err); 
  }
});

// --- Add PUT route for profile update ---
// Apply shared middleware directly
router.put('/profile', isAuthenticated, async (req: Request, res: Response, next: NextFunction) => {
  const userId = req.user?.id;
  const { full_name, nickname, avatar_color } = req.body;
  const startTime = Date.now(); // Record start time
  // console.log(`[${new Date().toISOString()}] PUT PROFILE START: Handling /api/user/profile for user ${userId}`);

  if (!userId) {
    console.error(`[${new Date().toISOString()}] PUT PROFILE ERROR: No user ID found after isAuthenticated middleware.`);
    return res.status(401).json({ error: 'Authentication failed unexpectedly' });
  }

  // Updated validation: Make all fields mandatory non-empty strings
  if (!full_name || typeof full_name !== 'string' || full_name.trim() === '') {
    console.error(`[${new Date().toISOString()}] PUT PROFILE ERROR: Invalid full_name for user ${userId}`);
    return res.status(400).json({ error: 'First name and last name are required.'});
  }
  if (!nickname || typeof nickname !== 'string' || nickname.trim() === '') {
    console.error(`[${new Date().toISOString()}] PUT PROFILE ERROR: Invalid nickname for user ${userId}`);
    return res.status(400).json({ error: 'Nickname is required.'});
  }
  if (!avatar_color || typeof avatar_color !== 'string' || avatar_color.trim() === '') {
    console.error(`[${new Date().toISOString()}] PUT PROFILE ERROR: Invalid avatar_color for user ${userId}`);
    return res.status(400).json({ error: 'Avatar color is required.'});
  }

  try {
    // console.log(`[${new Date().toISOString()}] PUT PROFILE DB UPDATE START: Updating profile for user ${userId}`);
    const updateStartTime = Date.now();
    const { data: updatedProfile, error } = await supabase
      .from('profiles')
      .update({
        full_name: full_name.trim(),
        nickname: nickname.trim() || null, 
        avatar_color: avatar_color,
      })
      .eq('id', userId)
      .select(`
        id,
        full_name,
        nickname,
        avatar_color,
        avatar_url, 
        email_preferences
      `) // Select the updated data to return
      .single();
    const updateEndTime = Date.now();
    // console.log(`[${new Date().toISOString()}] PUT PROFILE DB UPDATE END: Update took ${updateEndTime - updateStartTime}ms for user ${userId}. Error: ${error ? JSON.stringify(error) : 'None'}`);

    if (error) {
        console.error(`[${new Date().toISOString()}] PUT PROFILE DB ERROR: Supabase update error for user ${userId}:`, error);
        throw error;
    }

    if (!updatedProfile) {
       console.warn(`[${new Date().toISOString()}] PUT PROFILE WARN: Profile not found after update attempt for user ${userId}`);
       return handleSupabaseError(res, { status: 404, message: 'Profile not found after update attempt.' });
    }

    // console.log(`[${new Date().toISOString()}] PUT PROFILE SUCCESS: Sending updated profile for user ${userId}. Total time: ${Date.now() - startTime}ms`);
    res.json(updatedProfile);

  } catch (error) {
    console.error(`[${new Date().toISOString()}] PUT PROFILE CATCH ERROR: Catch block error for user ${userId}. Total time: ${Date.now() - startTime}ms`, error);
    handleSupabaseError(res, error, 'Failed to update user profile');
  }
});

// PUT /api/user/password
// Apply shared middleware directly, then our custom rate limiter
router.put('/password', isAuthenticated, rateLimitPasswordUpdate, async (req: Request, res: Response, next: NextFunction) => {
  const userId = req.user?.id;
  const { currentPassword, newPassword } = req.body;

  // console.log(`PUT /api/user/password hit for user ${userId}`);

  if (!userId) {
    // Defensive check
    return res.status(401).json({ error: 'Authentication failed unexpectedly' });
  }

  // Basic validation
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: 'Missing current or new password.' });
  }
  if (typeof currentPassword !== 'string' || typeof newPassword !== 'string') {
    return res.status(400).json({ error: 'Invalid data types for passwords.' });
  }
  // Add password complexity rules here if desired
  if (newPassword.length < 8) { // Example: Minimum length
    return res.status(400).json({ error: 'New password must be at least 8 characters long.' });
  }

  try {
    // 1. Verify the current password
    // We need the user's email to sign in and verify the current password
    // Fetch email from Supabase auth using user ID if not readily available on req.user
    // Note: Ensure req.user contains the email or fetch it.
    // Assuming req.user.email exists:
    // @ts-ignore
    const userEmail = req.user?.email;
    if (!userEmail) {
      // Optional: Fetch user if email not on req.user
      // const { data: { user }, error: fetchError } = await supabase.auth.admin.getUserById(userId);
      // if (fetchError || !user) throw fetchError || new Error('Failed to fetch user details for password verification');
      // userEmail = user.email;
       return handleSupabaseError(res, { status: 500, message: 'User email not available for password verification.' });
    }

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: userEmail,
      password: currentPassword,
    });

    if (signInError) {
      // Differentiate between incorrect password and other errors if needed
      console.warn(`Password verification failed for user ${userId}: ${signInError.message}`);
      // Use a generic message for security
      return res.status(401).json({ error: 'Incorrect current password.' });
    }

    // 2. If current password is correct, update to the new password
    // This uses the updateUser function, operating under the context of the user 
    // authenticated by the token passed in the original request (verified by middleware)
    console.log(`Current password verified for ${userId}. Attempting update...`);
    const { data: updateData, error: updateError } = await supabase.auth.updateUser({
      password: newPassword
    });

    if (updateError) {
      // Handle potential errors during the update process (trigger failure etc.)
      console.error(`Password update Supabase error for user ${userId}:`, updateError); 
      // Throw the specific Supabase error so the catch block can handle it
      throw updateError; 
    }

    console.log('Password updated successfully for user:', userId);
    res.status(200).json({ message: 'Password updated successfully.' }); // Send success response

  } catch (error) {
    // Centralized handler deals with formatting Supabase errors or generic 500s
    handleSupabaseError(res, error, 'Failed to update password');
  }
});

// PUT /api/user/preferences
// Apply shared middleware directly
router.put('/preferences', isAuthenticated, async (req: Request, res: Response, next: NextFunction) => {
  const userId = req.user?.id;
  const { preferences } = req.body;

  // console.log(`PUT /api/user/preferences hit for user ${userId}`);

  if (!userId) {
    return res.status(401).json({ error: 'Authentication failed unexpectedly' });
  }

  // Validate preferences object structure
  if (!preferences || typeof preferences !== 'object' ||
      typeof preferences.contentUpdates !== 'boolean' ||
      typeof preferences.accountChanges !== 'boolean' ||
      typeof preferences.marketing !== 'boolean') {
    return res.status(400).json({ error: 'Invalid preferences data format.' });
  }

  try {
    // 1. Update preferences in database
    const { data: updatedProfile, error } = await supabase
      .from('profiles')
      .update({ email_preferences: preferences }) // Update the JSONB column
      .eq('id', userId)
      .select('id, email_preferences') // Select only relevant data
      .single();

    if (error) throw error;

    if (!updatedProfile) {
      return handleSupabaseError(res, { status: 404, message: 'Profile not found for updating preferences.' });
    }

    // 2. Get user email for Brevo sync
    const { data: userData, error: userError } = await supabase.auth.admin.getUserById(userId);
    if (userError || !userData?.user?.email) {
      console.error('Error fetching user email for Brevo sync:', userError);
      // We'll continue since the database update was successful
    } else {
      // 3. Sync preferences with Brevo
      try {
        const userEmail = userData.user.email;
        
        // Get user profile info for contact attribute updates
        const { data: profileData } = await supabase
          .from('profiles')
          .select('full_name, nickname')
          .eq('id', userId)
          .single();
        
        // Get Brevo SDK instance
        const brevoApi = require('../src/lib/emailBrevoService');
        
        // Check if the SDK and API key are available
        if (brevoApi && typeof brevoApi.syncContactPreferences === 'function') {
          await brevoApi.syncContactPreferences(
            userEmail, 
            preferences, 
            {
              FIRSTNAME: profileData?.full_name?.split(' ')[0] || '',
              LASTNAME: profileData?.full_name?.split(' ').slice(1).join(' ') || '',
              NICKNAME: profileData?.nickname || ''
            }
          );
          console.log(`Synced preferences for ${userEmail} with Brevo`);
        } else {
          console.log('Brevo sync function not available - skipping sync');
        }
      } catch (syncError) {
        // Log but don't fail the request if Brevo sync fails
        console.error('Error syncing preferences with Brevo:', syncError);
      }
    }

    console.log('Preferences updated successfully for user:', userId);
    res.status(200).json({ 
        message: 'Preferences updated successfully.',
        email_preferences: updatedProfile.email_preferences // Return updated preferences
    });

  } catch (error) {
    handleSupabaseError(res, error, 'Failed to update user preferences');
  }
});

// POST /api/user/progress - Create or update user progress for a section
// Apply shared middleware directly
router.post('/progress', isAuthenticated, async (req: Request, res: Response, next: NextFunction) => {
    const { section_id, completed } = req.body;
    const userId = req.user?.id;
    const startTime = Date.now();
    console.log(`[${new Date().toISOString()}] USER PROGRESS START: Handling POST /api/user/progress for user ${userId}, section ${section_id}`);

    if (!userId) {
        console.error(`[${new Date().toISOString()}] USER PROGRESS ERROR: No user ID found after auth.`);
        return res.status(401).json({ error: 'Authentication failed unexpectedly' });
    }

    if (!section_id || typeof section_id !== 'string') {
        console.error(`[${new Date().toISOString()}] USER PROGRESS ERROR: Invalid section_id for user ${userId}.`);
        return res.status(400).json({ error: 'Missing or invalid section_id' });
    }
    if (typeof completed !== 'boolean') {
        console.error(`[${new Date().toISOString()}] USER PROGRESS ERROR: Invalid completed status for user ${userId}, section ${section_id}.`);
        return res.status(400).json({ error: 'Missing or invalid completed status' });
    }

    try {
        // 1. Fetch module_id for the given section_id
        console.log(`[${new Date().toISOString()}] USER PROGRESS FETCH MODULE_ID START: Fetching section details for section ${section_id}`);
        const { data: sectionData, error: sectionError } = await supabase
            .from('sections')
            .select('module_id')
            .eq('id', section_id)
            .single();
        const fetchModuleIdEndTime = Date.now();
        console.log(`[${new Date().toISOString()}] USER PROGRESS FETCH MODULE_ID END: Fetch took ${fetchModuleIdEndTime - startTime}ms. Error: ${sectionError ? JSON.stringify(sectionError) : 'None'}`);
        
        if (sectionError || !sectionData?.module_id) {
            console.error(`[${new Date().toISOString()}] USER PROGRESS ERROR: Failed to fetch module_id for section ${section_id}.`, sectionError);
            return res.status(404).json({ error: 'Section not found or module_id missing.' });
        }
        const moduleId = sectionData.module_id;

        // 2. Upsert the progress record including module_id
        console.log(`[${new Date().toISOString()}] USER PROGRESS DB UPSERT START: Upserting progress for user ${userId}, section ${section_id}, module ${moduleId}`);
        const { data, error, status } = await supabase
            .from('user_progress')
            .upsert(
                {
                    user_id: userId,
                    section_id: section_id,
                    module_id: moduleId, // Include module_id
                    completed: completed,
                },
                {
                    onConflict: 'user_id, section_id', // Keep this if appropriate, or adjust if PK/Unique Index includes module_id
                                                     // If your UNIQUE index is (user_id, section_id, module_id), change onConflict
                }
            )
            .select()
            .single();
        const queryEndTime = Date.now();
        console.log(`[${new Date().toISOString()}] USER PROGRESS DB UPSERT END: Upsert took ${queryEndTime - fetchModuleIdEndTime}ms for user ${userId}, section ${section_id}. Error: ${error ? JSON.stringify(error) : 'None'}`);

        if (error) {
            console.error(`[${new Date().toISOString()}] USER PROGRESS DB ERROR: Supabase upsert error for user ${userId}, section ${section_id}:`, error);
            return handleSupabaseError(error, res, next, status);
        }

        console.log(`[${new Date().toISOString()}] USER PROGRESS SUCCESS: Sending updated progress for user ${userId}, section ${section_id}. Total time: ${Date.now() - startTime}ms`);
        res.status(200).json(data);

    } catch (err) {
        console.error(`[${new Date().toISOString()}] USER PROGRESS CATCH ERROR: Catch block for user ${userId}, section ${section_id}. Total time: ${Date.now() - startTime}ms`, err);
        next(err);
    }
});

// --- Placeholder for email update ---
router.put('/email', (req: Request, res: Response) => {
  // ... existing code ...
});

// POST /api/user/sync-brevo - Sync a user with Brevo
router.post('/sync-brevo', async (req: Request, res: Response, next: NextFunction) => {
  const { email, userId, preferences } = req.body;

  // Validate required fields
  if (!email || !userId) {
    return res.status(400).json({ error: 'Email and userId are required' });
  }

  // Use default preferences if not provided
  const userPreferences = preferences || {
    contentUpdates: true,
    accountChanges: true,
    marketing: true
  };

  try {
    // Get user profile for additional data
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('full_name, nickname')
      .eq('id', userId)
      .single();

    if (profileError && profileError.code !== 'PGRST116') { // Not found is ok for new users
      console.error(`Error fetching profile for Brevo sync (${userId}):`, profileError);
      // Continue anyway as the user might be new and profile not yet created
    }

    // Extract name components for Brevo attributes
    let firstName = '';
    let lastName = '';
    
    if (profileData?.full_name) {
      const nameParts = profileData.full_name.split(' ');
      firstName = nameParts[0] || '';
      lastName = nameParts.slice(1).join(' ') || '';
    }

    // Load the Brevo API service
    const brevoApi = require('../src/lib/emailBrevoService');
    
    // Check if Brevo API is available
    if (!brevoApi || typeof brevoApi.syncContactPreferences !== 'function') {
      return res.status(500).json({ error: 'Brevo API not properly configured' });
    }

    // Sync user with Brevo
    const syncResult = await brevoApi.syncContactPreferences(
      email,
      userPreferences,
      {
        FIRSTNAME: firstName,
        LASTNAME: lastName,
        NICKNAME: profileData?.nickname || ''
      }
    );

    if (!syncResult.success) {
      throw new Error(syncResult.message || 'Failed to sync with Brevo');
    }

    res.status(200).json({ 
      success: true, 
      message: 'User successfully synchronized with Brevo'
    });

  } catch (error) {
    console.error('Error syncing user with Brevo:', error);
    res.status(500).json({ 
      error: 'Failed to sync user with Brevo', 
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

module.exports = router; 