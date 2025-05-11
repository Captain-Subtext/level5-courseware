import { Request, Response, NextFunction } from 'express';
const express = require('express');
const router = express.Router();

// Import the proper authentication middleware
const { isAuthenticated } = require('../middleware/auth'); // Adjust path if needed
const { supabase } = require('../src/lib/supabase'); // Adjust path if needed
const { handleSupabaseError } = require('./error-utils'); // Adjust path if needed

// GET /api/bookmarks?module_id=... - Get bookmark for a specific module
// Apply the isAuthenticated middleware
router.get('/', isAuthenticated, async (req: Request, res: Response, next: NextFunction) => {
  const { module_id } = req.query;
  // req.user should now be populated by isAuthenticated middleware
  const userId = req.user?.id; 

  // Check if user ID exists after authentication
  if (!userId) {
    // This shouldn't happen if isAuthenticated passes, but good practice
    console.error('User ID missing after authentication in GET /bookmarks');
    return res.status(401).json({ error: 'Authentication failed' });
  }

  if (!module_id || typeof module_id !== 'string') {
    return res.status(400).json({ error: 'Missing or invalid module_id query parameter' });
  }

  try {
    const { data, error, status } = await supabase
      .from('user_bookmarks')
      .select('*')
      .eq('user_id', userId)
      .eq('module_id', module_id)
      .maybeSingle(); // Use maybeSingle() as a bookmark might not exist

    if (error) {
      return handleSupabaseError(error, res, next, status);
    }
    
    // maybeSingle returns null if no record is found, which is valid here
    res.status(200).json(data); 

  } catch (err) {
    console.error(`Unexpected error fetching bookmark for module ${module_id}, user ${userId}:`, err);
    next(err);
  }
});

// POST /api/bookmarks - Create or update a bookmark
// Apply the isAuthenticated middleware
router.post('/', isAuthenticated, async (req: Request, res: Response, next: NextFunction) => {
  const { module_id, section_id } = req.body;
  // req.user should now be populated by isAuthenticated middleware
  const userId = req.user?.id;

  // Check if user ID exists after authentication
  if (!userId) {
    // This shouldn't happen if isAuthenticated passes
    console.error('User ID missing after authentication in POST /bookmarks');
    return res.status(401).json({ error: 'Authentication failed' });
  }

  if (!module_id) {
    return res.status(400).json({ error: 'Missing required field: module_id' });
  }
  // section_id can be null or a valid UUID

  try {
    // Use upsert to create or update the bookmark for the user/module combination
    const { data, error, status } = await supabase
      .from('user_bookmarks')
      .upsert({ 
        user_id: userId, 
        module_id: module_id,
        section_id: section_id // Can be null
      }, { 
        onConflict: 'user_id, module_id' // Specify conflict target
      })
      .select() // Select the inserted/updated row
      .single(); // Expect one row back

    if (error) {
      return handleSupabaseError(error, res, next, status);
    }

    res.status(200).json(data); // Return the created/updated bookmark

  } catch (err) {
    console.error(`Unexpected error upserting bookmark for module ${module_id}, user ${userId}:`, err);
    next(err);
  }
});

module.exports = router; 