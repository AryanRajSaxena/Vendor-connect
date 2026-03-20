import { createClient } from '@supabase/supabase-js';

function requireEnv(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

const supabaseUrl = requireEnv(
  'NEXT_PUBLIC_SUPABASE_URL',
  process.env.NEXT_PUBLIC_SUPABASE_URL
);
const supabaseAnonKey = requireEnv(
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const isServer = typeof window === 'undefined';

// API routes run on the server and should use service role to avoid RLS blocking
// internal trusted operations. Browser code should always use the anon key.
const supabaseKey = isServer
  ? supabaseServiceRoleKey || supabaseAnonKey
  : supabaseAnonKey;

if (isServer && !supabaseServiceRoleKey) {
  console.warn(
    'SUPABASE_SERVICE_ROLE_KEY is not set. Server routes will use anon key and may fail due to RLS policies.'
  );
}

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

// Initialize database if needed
export async function initializeDatabase() {
  try {
    // Check if tables exist and create them if needed
    await createTables();
  } catch (error) {
    console.error('Database initialization error:', error);
  }
}

async function createTables() {
  // Tables will be created via Supabase SQL
  // This function is a placeholder for any post-initialization logic
}
