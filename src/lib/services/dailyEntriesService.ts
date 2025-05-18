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
    notes: string;
    videoUrls: string[];
    importantEvents?: string;
  }
): Promise<DailyEntry | null> {
  const dateKey = format(date, 'yyyy-MM-dd');
  
  // Check if entry already exists
  const { data: existingEntry } = await supabase
    .from('daily_entries')
    .select('id')
    .eq('date', dateKey)
    .eq('user_id', userId)
    .single();
    
  const entry = {
    user_id: userId,
    date: dateKey,
    notes: content.notes,
    video_urls: content.videoUrls,
    important_events: content.importantEvents || null,
    updated_at: new Date().toISOString()
  };
  
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