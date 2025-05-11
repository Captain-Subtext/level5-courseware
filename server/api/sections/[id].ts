import { Request, Response, NextFunction } from 'express';
const express = require('express');
const router = express.Router({ mergeParams: true }); // Ensure mergeParams is true

// Use relative path for supabase import
const { supabase } = require('../../src/lib/supabase'); 

// Middleware to validate UUID
function validateUUID(req: Request, res: Response, next: NextFunction) {
  // ... existing code ...
}

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const sectionId = params.id;
    
    if (!sectionId) {
      return new Response(JSON.stringify({ error: 'Section ID is required' }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
        },
      });
    }
    
    const { data, error } = await supabase
      .from('sections')
      .select('*')
      .eq('id', sectionId)
      .single();
      
    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
        },
      });
    }
    
    return new Response(JSON.stringify(data || {}), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
} 