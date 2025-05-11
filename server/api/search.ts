import { Request, Response, NextFunction } from 'express';
const express = require('express');
const router = express.Router();

// Adjust path if needed
const { supabase } = require('../src/lib/supabase'); 
const { handleSupabaseError } = require('./error-utils'); 

// GET /api/search?query=...
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  const searchQuery = req.query.query as string | undefined;

  if (!searchQuery || typeof searchQuery !== 'string' || searchQuery.trim() === '') {
    return res.status(400).json({ error: 'Missing or invalid search query parameter' });
  }

  console.log(`API Search: Received query '${searchQuery}'`);

  try {
    // Call the database function
    const { data, error, status } = await supabase.rpc('search_content', { 
      search_term: searchQuery 
    });

    if (error) {
      console.error(`Supabase RPC error calling search_content for query "${searchQuery}":`, status, error.message);
      return handleSupabaseError(error, res, next, status);
    }

    console.log(`API Search: Found ${data?.length || 0} matching modules for query "${searchQuery}"`);
    res.status(200).json(data || []); // Return the array of matching modules

  } catch (err) {
    console.error(`Unexpected error during content search for query "${searchQuery}":`, err);
    next(err);
  }
});

module.exports = router; 