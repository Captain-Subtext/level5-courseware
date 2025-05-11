import { Request, Response, NextFunction } from 'express';
const express = require('express');
const router = express.Router();

// Correct path for require() relative to current file
const { supabase } = require('../src/lib/supabase');

// GET /api/sections
// Optional: Filters by module_id if provided as a query parameter
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  const moduleId = req.query.module_id as string | undefined;
  
  try {
    let query = supabase
      .from('sections') // Query sections table
      .select('*')
      .order('order_index', { ascending: true });
      
    // Apply filter if moduleId is provided
    if (moduleId) {
      // console.log(`API: Fetching sections for module_id: ${moduleId}`); // Commented out
      query = query.eq('module_id', moduleId);
    } else {
      // console.log('API: Fetching all sections (no module_id provided).'); // Commented out
    }
      
    const { data, error } = await query;
      
    if (error) {
      return next(error); // Pass error to central handler
    }
    
    res.status(200).json(data || []);

  } catch (error) {
    next(error); // Pass unexpected errors to central handler
  }
});

// GET /api/sections/:id 
// NOTE: The original api/index was handling this via dynamic import of './sections/[id]'
// We need to add this route here now.
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const sectionId = req.params.id;
    if (!sectionId) {
      return res.status(400).json({ error: 'Section ID is required' });
    }

    const { data, error } = await supabase
      .from('sections')
      .select('*')
      .eq('id', sectionId)
      .single();
      
    if (error) {
      if (error.code === 'PGRST116') { // Handle "No rows found" specifically
        return res.status(404).json({ error: 'Section not found' });
      }
      return next(error); // Pass other DB errors to central handler
    }

    if (!data) { // Should be covered by PGRST116, but good practice
        return res.status(404).json({ error: 'Section not found' });
    }
    
    res.status(200).json(data);

  } catch (error) {
    next(error); // Pass unexpected errors to central handler
  }
});


// Add other method handlers (POST, PUT, DELETE for / or /:id) if needed

module.exports = router; 