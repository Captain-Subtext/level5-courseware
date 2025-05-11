import { Request, Response, NextFunction } from 'express';
const express = require('express');
const router = express.Router();

// Correct path for require() relative to current file
const { supabase } = require('../src/lib/supabase');

// GET /api/modules
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { data, error } = await supabase
      .from('modules')
      .select('*')
      .order('order_index', { ascending: true });
      
    if (error) {
      // Pass error to the central error handler in server.ts
      return next(error);
    }
    
    res.status(200).json(data || []);

  } catch (error) {
    // Pass unexpected errors to the central error handler
    next(error); 
  }
});

// GET /api/modules/:id - Fetches a single module by its ID
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.params;

  // Basic validation for the ID parameter
  if (!id) {
    return res.status(400).json({ error: 'Module ID parameter is required' });
  }

  try {
    // Fetch the specific module from Supabase
    const { data, error, status } = await supabase
      .from('modules')
      .select('*') // Select all columns for the module
      .eq('id', id)   // Filter by the provided ID
      .single();      // Expect only one result

    // Handle Supabase errors
    if (error) {
      console.error(`Supabase error fetching module ${id}:`, status, error.message);
      // If the error code indicates 'Not Found' (PGRST116: Row Level Security policies prevent fetching non-existent rows or forbidden rows)
      if (error.code === 'PGRST116') { 
        return res.status(404).json({ error: `Module with ID ${id} not found or access denied` });
      }
      // For other database errors, pass to the central error handler
      error.status = status || 500; // Ensure status is set for central handler
      return next(error);
    }

    // Although .single() should throw PGRST116 if not found, add a fallback check
    if (!data) {
      return res.status(404).json({ error: `Module with ID ${id} not found (unexpected)` });
    }

    // Send the fetched module data
    res.status(200).json(data);

  } catch (err) {
    // Catch unexpected errors (e.g., network issues, programming errors)
    console.error(`Unexpected error fetching module ${id}:`, err);
    // Pass to the central error handler
    next(err); 
  }
});

// Add other method handlers (POST, PUT, DELETE for / or /:id) if they existed

module.exports = router; 