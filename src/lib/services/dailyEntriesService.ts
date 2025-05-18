import { supabase, DailyEntry, ImageEntry } from '../supabase';
import { format } from 'date-fns';

export async function getDailyEntry(date: Date, userId: string): Promise<DailyEntry | null> {
  const dateKey = format(date, 'yyyy-MM-dd');
  
  try {
    const { data, error } = await supabase
      .from('daily_entries')
      .select('*')
      .eq('date', dateKey)
      .eq('user_id', userId)
      .single();
      
    if (error) {
      // Check if this is just a "no rows returned" error, which is expected sometimes
      if (error.code === 'PGRST116') {
        return null;
      }
      console.error('Error fetching daily entry:', error);
      return null;
    }
    
    return data as DailyEntry;
  } catch (err) {
    console.error('Exception fetching daily entry:', err);
    return null;
  }
}

export async function getEntriesInDateRange(startDate: Date, endDate: Date, userId: string): Promise<DailyEntry[]> {
  const startDateKey = format(startDate, 'yyyy-MM-dd');
  const endDateKey = format(endDate, 'yyyy-MM-dd');
  
  const { data, error } = await supabase
    .from('daily_entries')
    .select('*')
    .eq('user_id', userId)
    .gte('date', startDateKey)
    .lte('date', endDateKey);
    
  if (error) {
    console.error('Error fetching entries in range:', error);
    return [];
  }
  
  return data as DailyEntry[];
}

export async function saveDailyEntry(
  date: Date, 
  userId: string, 
  content: {
    notes?: string;
    videoUrls?: string[];
    importantEvents?: string;
    featuredImageUrl?: string;
  }
): Promise<DailyEntry | null> {
  const dateKey = format(date, 'yyyy-MM-dd');
  
  // Check if entry already exists
  const { data: existingEntry } = await supabase
    .from('daily_entries')
    .select('*')
    .eq('date', dateKey)
    .eq('user_id', userId)
    .single();
    
  // Create entry object with existing data (if any) plus updates
  const entry: any = {
    user_id: userId,
    date: dateKey,
    updated_at: new Date().toISOString()
  };
  
  // If we're updating an existing entry, preserve existing values
  if (existingEntry) {
    // Add existing values for fields we want to preserve
    entry.notes = content.notes ?? existingEntry.notes ?? '';
    entry.video_urls = content.videoUrls ?? existingEntry.video_urls ?? [];
    entry.important_events = content.importantEvents ?? existingEntry.important_events ?? null;
    
    // Only set featured_image_url if the column exists in the database schema
    if (content.featuredImageUrl !== undefined || existingEntry.featured_image_url !== undefined) {
      entry.featured_image_url = content.featuredImageUrl ?? existingEntry.featured_image_url ?? null;
    }
  } else {
    // New entry - use provided values or defaults
    entry.notes = content.notes ?? '';
    entry.video_urls = content.videoUrls ?? [];
    entry.important_events = content.importantEvents ?? null;
    
    // Only set featured_image_url if provided
    if (content.featuredImageUrl !== undefined) {
      entry.featured_image_url = content.featuredImageUrl;
    }
  }
  
  // Log the entry we're about to save
  console.log('Saving daily entry:', entry);
  
  let result;
  
  if (existingEntry) {
    // Update existing entry
    result = await supabase
      .from('daily_entries')
      .update(entry)
      .eq('id', existingEntry.id)
      .select('*')
      .single();
  } else {
    // Create new entry
    result = await supabase
      .from('daily_entries')
      .insert({
        ...entry,
        created_at: new Date().toISOString()
      })
      .select('*')
      .single();
  }
  
  if (result.error) {
    console.error('Error saving daily entry:', result.error);
    console.error('Error details:', JSON.stringify(result.error, null, 2));
    console.error('Entry that failed to save:', entry);
    
    // Try again without the featured_image_url field if that might be causing the issue
    if (entry.featured_image_url !== undefined) {
      console.log('Attempting to save without featured_image_url field...');
      const { featured_image_url, ...entryWithoutFeatured } = entry;
      
      if (existingEntry) {
        result = await supabase
          .from('daily_entries')
          .update(entryWithoutFeatured)
          .eq('id', existingEntry.id)
          .select('*')
          .single();
      } else {
        result = await supabase
          .from('daily_entries')
          .insert({
            ...entryWithoutFeatured,
            created_at: new Date().toISOString()
          })
          .select('*')
          .single();
      }
      
      if (!result.error) {
        console.log('Save successful without featured_image_url field');
        // Return success but note that the database might need to be updated
        console.warn('Database schema may need a "featured_image_url" column in daily_entries table');
        return result.data as DailyEntry;
      } else {
        console.error('Still failed without featured_image_url:', result.error);
      }
    }
    
    return null;
  }
  
  return result.data as DailyEntry;
}

// Image handling with storage
export async function uploadImage(file: File, dailyEntryId: string, userId: string): Promise<ImageEntry | null> {
  const fileExt = file.name.split('.').pop();
  const fileName = `${userId}/${dailyEntryId}/${Date.now()}.${fileExt}`;
  const filePath = `daily-images/${fileName}`;
  
  try {
    console.log(`Uploading image for user ${userId} to entry ${dailyEntryId}`);
    
    // Upload to storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('images')
      .upload(filePath, file);
      
    if (uploadError) {
      console.error('Error uploading image:', uploadError);
      return null;
    }
    
    // Get public URL
    const { data: urlData } = supabase.storage
      .from('images')
      .getPublicUrl(filePath);
      
    if (!urlData?.publicUrl) {
      console.error('Could not get public URL for image');
      return null;
    }
    
    // Save image metadata to database
    const { data: imageEntry, error: imageError } = await supabase
      .from('images')
      .insert({
        daily_entry_id: dailyEntryId,
        storage_path: filePath,
        url: urlData.publicUrl,
        created_at: new Date().toISOString()
      })
      .select('*')
      .single();
      
    if (imageError) {
      console.error('Error saving image metadata:', imageError);
      // Attempt to clean up the uploaded file
      await supabase.storage.from('images').remove([filePath]);
      return null;
    }
    
    return imageEntry as ImageEntry;
  } catch (err) {
    console.error('Exception in uploadImage:', err);
    return null;
  }
}

export async function getDailyImages(dailyEntryId: string): Promise<ImageEntry[]> {
  try {
    console.log(`Getting images for entry ${dailyEntryId}`);
    
    const { data, error } = await supabase
      .from('images')
      .select('*')
      .eq('daily_entry_id', dailyEntryId);
      
    if (error) {
      console.error('Error fetching daily images:', error);
      return [];
    }
    
    return data as ImageEntry[];
  } catch (err) {
    console.error('Exception in getDailyImages:', err);
    return [];
  }
}

export async function deleteImage(imageId: string): Promise<boolean> {
  try {
    console.log(`Deleting image ${imageId}`);
    
    // First get the image to find the storage path
    const { data: image, error: fetchError } = await supabase
      .from('images')
      .select('storage_path')
      .eq('id', imageId)
      .single();
      
    if (fetchError || !image) {
      console.error('Error fetching image to delete:', fetchError);
      return false;
    }
    
    // Delete from storage
    const { error: storageError } = await supabase.storage
      .from('images')
      .remove([image.storage_path]);
      
    if (storageError) {
      console.error('Error deleting image from storage:', storageError);
      // Continue with database deletion anyway
    }
    
    // Delete from database
    const { error: dbError } = await supabase
      .from('images')
      .delete()
      .eq('id', imageId);
      
    if (dbError) {
      console.error('Error deleting image from database:', dbError);
      return false;
    }
    
    return true;
  } catch (err) {
    console.error('Exception in deleteImage:', err);
    return false;
  }
} 