import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Type definitions for our Supabase tables
export type DailyEntry = {
  id: string;
  user_id: string;
  date: string; // Format: YYYY-MM-DD
  notes: string;
  video_urls: string[];
  important_events: string | null;
  featured_image_url: string | null;
  created_at: string;
  updated_at: string;
};

export type ImageEntry = {
  id: string;
  daily_entry_id: string;
  storage_path: string;
  url: string;
  created_at: string;
};

export type Task = {
  id: string;
  user_id: string;
  text: string;
  date: string; // Format: YYYY-MM-DD
  completed: boolean;
  completed_at: string | null;
  is_global: boolean; // If true, task repeats daily
  created_at: string;
  updated_at: string;
}; 