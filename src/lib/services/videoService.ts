import { supabase, Video, Tag, VideoTag } from '../supabase';

// Videos operations
export async function saveVideo(
  userId: string,
  url: string,
  dailyEntryId?: string,
  title?: string,
  description?: string
): Promise<Video | null> {
  try {
    const { data, error } = await supabase
      .from('videos')
      .insert({
        user_id: userId,
        daily_entry_id: dailyEntryId || null,
        url,
        title: title || null,
        description: description || null
      })
      .select('*')
      .single();

    if (error) {
      console.error('Error saving video:', error);
      return null;
    }

    return data as Video;
  } catch (err) {
    console.error('Exception saving video:', err);
    return null;
  }
}

export async function getUserVideos(userId: string): Promise<Video[]> {
  try {
    const { data, error } = await supabase
      .from('videos')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching videos:', error);
      return [];
    }

    return data as Video[];
  } catch (err) {
    console.error('Exception fetching videos:', err);
    return [];
  }
}

export async function getVideoById(videoId: string): Promise<Video | null> {
  try {
    const { data, error } = await supabase
      .from('videos')
      .select('*')
      .eq('id', videoId)
      .single();

    if (error) {
      console.error('Error fetching video:', error);
      return null;
    }

    return data as Video;
  } catch (err) {
    console.error('Exception fetching video:', err);
    return null;
  }
}

export async function updateVideo(
  videoId: string,
  updates: { title?: string; description?: string }
): Promise<Video | null> {
  try {
    const { data, error } = await supabase
      .from('videos')
      .update(updates)
      .eq('id', videoId)
      .select('*')
      .single();

    if (error) {
      console.error('Error updating video:', error);
      return null;
    }

    return data as Video;
  } catch (err) {
    console.error('Exception updating video:', err);
    return null;
  }
}

export async function deleteVideo(videoId: string): Promise<boolean> {
  try {
    // First delete associated tags
    const { error: tagError } = await supabase
      .from('video_tags')
      .delete()
      .eq('video_id', videoId);

    if (tagError) {
      console.error('Error deleting video tags:', tagError);
      return false;
    }

    // Then delete the video
    const { error } = await supabase
      .from('videos')
      .delete()
      .eq('id', videoId);

    if (error) {
      console.error('Error deleting video:', error);
      return false;
    }

    return true;
  } catch (err) {
    console.error('Exception deleting video:', err);
    return false;
  }
}

// Tags operations
export async function createTag(userId: string, name: string): Promise<Tag | null> {
  try {
    // Check if tag already exists
    const { data: existingTag, error: checkError } = await supabase
      .from('tags')
      .select('*')
      .eq('user_id', userId)
      .eq('name', name)
      .single();

    if (!checkError && existingTag) {
      return existingTag as Tag;
    }

    // Create new tag
    const { data, error } = await supabase
      .from('tags')
      .insert({
        user_id: userId,
        name
      })
      .select('*')
      .single();

    if (error) {
      console.error('Error creating tag:', error);
      return null;
    }

    return data as Tag;
  } catch (err) {
    console.error('Exception creating tag:', err);
    return null;
  }
}

export async function getUserTags(userId: string): Promise<Tag[]> {
  try {
    const { data, error } = await supabase
      .from('tags')
      .select('*')
      .eq('user_id', userId)
      .order('name');

    if (error) {
      console.error('Error fetching tags:', error);
      return [];
    }

    return data as Tag[];
  } catch (err) {
    console.error('Exception fetching tags:', err);
    return [];
  }
}

export async function deleteTag(tagId: string): Promise<boolean> {
  try {
    // First delete associated video tags
    const { error: tagError } = await supabase
      .from('video_tags')
      .delete()
      .eq('tag_id', tagId);

    if (tagError) {
      console.error('Error deleting video associations:', tagError);
      return false;
    }

    // Then delete the tag
    const { error } = await supabase
      .from('tags')
      .delete()
      .eq('id', tagId);

    if (error) {
      console.error('Error deleting tag:', error);
      return false;
    }

    return true;
  } catch (err) {
    console.error('Exception deleting tag:', err);
    return false;
  }
}

// Video Tags operations
export async function addTagToVideo(videoId: string, tagId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('video_tags')
      .insert({
        video_id: videoId,
        tag_id: tagId
      });

    if (error) {
      // Ignore if it's a duplicate
      if (error.code === '23505') {
        return true;
      }
      console.error('Error adding tag to video:', error);
      return false;
    }

    return true;
  } catch (err) {
    console.error('Exception adding tag to video:', err);
    return false;
  }
}

export async function removeTagFromVideo(videoId: string, tagId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('video_tags')
      .delete()
      .eq('video_id', videoId)
      .eq('tag_id', tagId);

    if (error) {
      console.error('Error removing tag from video:', error);
      return false;
    }

    return true;
  } catch (err) {
    console.error('Exception removing tag from video:', err);
    return false;
  }
}

export async function getVideoTags(videoId: string): Promise<Tag[]> {
  try {
    const { data, error } = await supabase
      .from('video_tags')
      .select('tags(*)')
      .eq('video_id', videoId);

    if (error) {
      console.error('Error fetching video tags:', error);
      return [];
    }

    return data.map(item => item.tags) as Tag[];
  } catch (err) {
    console.error('Exception fetching video tags:', err);
    return [];
  }
}

export async function getVideosWithTags(userId: string): Promise<Array<Video & { tags: Tag[] }>> {
  try {
    const { data: videos, error: videosError } = await supabase
      .from('videos')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (videosError) {
      console.error('Error fetching videos:', videosError);
      return [];
    }

    const videosWithTags = await Promise.all(
      videos.map(async (video) => {
        const tags = await getVideoTags(video.id);
        return {
          ...video,
          tags
        };
      })
    );

    return videosWithTags as Array<Video & { tags: Tag[] }>;
  } catch (err) {
    console.error('Exception fetching videos with tags:', err);
    return [];
  }
}

export async function getVideosByTag(userId: string, tagId: string): Promise<Video[]> {
  try {
    const { data, error } = await supabase
      .from('video_tags')
      .select('videos(*)')
      .eq('tag_id', tagId)
      .eq('videos.user_id', userId);

    if (error) {
      console.error('Error fetching videos by tag:', error);
      return [];
    }

    return data.map(item => item.videos) as Video[];
  } catch (err) {
    console.error('Exception fetching videos by tag:', err);
    return [];
  }
} 