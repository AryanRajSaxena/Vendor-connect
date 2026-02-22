import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://iuuteecnutmqugbjtntg.supabase.co';
const supabaseAnonKey = 'sb_publishable_0XpZsUiq-Zbx9IYQMEF01A_1UEaFRFK';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Initialize database if needed
export async function initializeDatabase() {
  try {
    // Check if tables exist and create them if needed
    await createTables();
    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Database initialization error:', error);
  }
}

async function createTables() {
  // Tables will be created via Supabase SQL
  // This function is a placeholder for any post-initialization logic
}
