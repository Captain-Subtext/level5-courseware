import { PostgrestError } from '@supabase/supabase-js';

// Use require() for imports
const supabaseJs = require('@supabase/supabase-js');
// Note: Accessing value PostgrestError via require might be tricky, 
// TS might handle type check via import even in CJS context if types are installed.

/**
 * Standard error response format for API endpoints
 * Keep interface export for type usage
 */
export interface ErrorResponse {
  error: string;
  message?: string;
  code?: string;
  status: number;
}

/**
 * Process Supabase errors into standard format
 * (Keep function logic as is)
 */
function handleSupabaseError(error: PostgrestError | Error | unknown, defaultMessage: string = 'Database operation failed'): ErrorResponse {
  // Handle PostgrestError from Supabase
  if (error && typeof error === 'object' && 'code' in error) {
    const pgError = error as PostgrestError;
    
    // Special case for "no rows returned" - this isn't always an error
    if (pgError.code === 'PGRST116') {
      return {
        error: 'Not found',
        message: 'The requested resource does not exist',
        code: pgError.code,
        status: 404
      };
    }

    return {
      error: pgError.message || defaultMessage,
      message: pgError.details || undefined,
      code: pgError.code,
      status: 500 // Most database errors are server errors
    };
  }
  
  // Handle standard Error objects
  if (error instanceof Error) {
    return {
      error: error.message || defaultMessage,
      status: 500
    };
  }
  
  // Handle unknown errors
  return { error: defaultMessage, message: error ? String(error) : undefined, status: 500 };
}

// Export the useful function 
module.exports = {
  handleSupabaseError,
}; 