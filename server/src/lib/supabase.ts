// Use require() for imports
const { createClient } = require('@supabase/supabase-js');

// Use process.env for server-side environment variables
// IMPORTANT: Server should use SERVICE_KEY, not ANON_KEY
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || ''; // Use Service Role Key

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Error: SUPABASE_URL and SUPABASE_SERVICE_KEY must be defined in environment variables.');
  // Optionally throw an error or exit if configuration is missing
  // throw new Error('Missing Supabase configuration.');
}

// Security options for the Supabase client (mostly unchanged)
const options = {
  auth: {
    autoRefreshToken: false,
    persistSession: false, // Typically false for server-side usage
    detectSessionInUrl: false,
    flowType: 'pkce' as const,
    debug: false,
    storageKey: 'supabase-auth-token-server', // Different key for server if needed
  },
  global: {
    headers: {
      'X-Supabase-Client': 'courseware-server', // Identify server client
    },
  },
  db: {
    schema: 'public',
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
  storage: {
    autoRefreshToken: {
      refreshBuffer: 60,
      retryInterval: 300,
    }
  }
}

// Create Supabase client using Service Key
const supabase = createClient(supabaseUrl, supabaseServiceKey, options);

// --- Utility Functions ---

async function executeQuery(operation: () => Promise<any>) {
  // ... function body unchanged ...
  try {
    const { data, error } = await operation();
    if (error) {
      console.error('Supabase operation error:', error);
      throw error; // Re-throw Supabase error object for better handling upstream
    }
    return data;
  } catch (err) {
    console.error('Supabase query execution error:', err);
    throw err;
  }
}

async function createConfigTableIfNotExists() {
  // ... function body unchanged ...
  // Note: This uses rpc and direct table access, requires appropriate permissions or service key.
  const { error } = await supabase.rpc('create_config_table_if_not_exists');
  if (error) {
    console.error('Failed to create config table via RPC, falling back to direct SQL');
    try {
      // This fallback seems complex and might indicate an issue with the RPC function itself
      // Ensure the _config_table_setup table/view exists and is selectable by the role used.
      await executeQuery(() => {
        return Promise.resolve(supabase.from('_config_table_setup').select('*').limit(1));
      });
    } catch (err) {
      console.error('Could not create config table:', err);
    }
  }
  return { error };
}

// --- Type Exports --- (Keep exports for TS usage)
export type User = { /* ... unchanged */ 
  id: string
  email: string
  full_name: string
  nickname?: string
  avatar_url?: string
  avatar_color?: string
  created_at: string
  last_sign_in: string
  subscription_status?: string
  subscription_tier?: string
  email_preferences?: {
    contentUpdates: boolean
    accountChanges: boolean
    marketing: boolean
  }
}
export type CourseModule = { /* ... unchanged */ 
  id: string
  title: string
  description: string
  order_index: number
}
export type CourseSection = { /* ... unchanged */ 
  id: string
  module_id: string
  title: string
  content: string
  duration: string
  order_index: number
}
export type UserProgress = { /* ... unchanged */ 
  user_id: string
  section_id: string
  completed: boolean
  completed_at: string
}
export type UserBookmark = { /* ... unchanged */ 
  id: string
  user_id: string
  module_id: string
  section_id: string
  timestamp: string
}

// --- Module Exports --- 
module.exports = {
  supabase, // Export the configured client
  executeQuery,
  createConfigTableIfNotExists,
  // Note: Types are exported using standard TS `export type` above
}; 