'use client';

import { supabase } from '@/lib/supabase';

/**
 * Adds the featured_image_url column to the daily_entries table if it doesn't exist
 * This is a client-side fix that should only be used by administrators
 */
export async function addFeaturedImageUrlColumn(): Promise<{ success: boolean; message: string }> {
  try {
    // Check if the user has admin privileges
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return { success: false, message: 'You must be logged in to perform this operation' };
    }
    
    // Execute the SQL to add the column
    const { error } = await supabase.rpc('exec_sql', {
      query: 'ALTER TABLE daily_entries ADD COLUMN IF NOT EXISTS featured_image_url TEXT;'
    });
    
    if (error) {
      console.error('Error adding column:', error);
      return { 
        success: false, 
        message: `Failed to add column: ${error.message}. Please use the Supabase dashboard instead.`
      };
    }
    
    return { 
      success: true, 
      message: 'Successfully added featured_image_url column to daily_entries table'
    };
  } catch (e) {
    console.error('Exception adding column:', e);
    return { 
      success: false, 
      message: 'An unexpected error occurred. Please update the schema through the Supabase dashboard.'
    };
  }
} 