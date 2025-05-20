'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Loader2, Tag as TagIcon, Search, X, FilterIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/lib/hooks/useAuth';
import { getVideosWithTags, getUserTags, deleteVideo } from '@/lib/services/videoService';
import { Video, Tag } from '@/lib/supabase';
import YoutubeEmbed from '@/components/custom/YoutubeEmbed';
import { format } from 'date-fns';
import { 
  Sheet, 
  SheetContent, 
  SheetDescription, 
  SheetHeader, 
  SheetTitle, 
  SheetTrigger,
  SheetFooter,
  SheetClose
} from '@/components/ui/sheet';

interface VideoWithTags extends Video {
  tags: Tag[];
}

export default function VideosPage() {
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  
  const [videos, setVideos] = useState<VideoWithTags[]>([]);
  const [allTags, setAllTags] = useState<Tag[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  useEffect(() => {
    if (!user?.id) return;
    
    const loadData = async () => {
      setIsLoading(true);
      try {
        const videosData = await getVideosWithTags(user.id);
        setVideos(videosData as VideoWithTags[]);
        
        const tagsData = await getUserTags(user.id);
        setAllTags(tagsData);
      } catch (error) {
        console.error('Error loading videos:', error);
        toast({
          title: 'Error',
          description: 'Failed to load videos. Please try again.',
          variant: 'destructive'
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    loadData();
  }, [user?.id, toast]);
  
  const handleTagClick = (tagId: string) => {
    if (selectedTags.includes(tagId)) {
      setSelectedTags(selectedTags.filter(id => id !== tagId));
    } else {
      setSelectedTags([...selectedTags, tagId]);
    }
  };
  
  const clearFilters = () => {
    setSelectedTags([]);
    setSearchTerm('');
  };
  
  const handleDeleteVideo = async (videoId: string) => {
    if (confirm('Are you sure you want to delete this video?')) {
      try {
        const success = await deleteVideo(videoId);
        if (success) {
          setVideos(videos.filter(video => video.id !== videoId));
          toast({
            title: 'Success',
            description: 'Video deleted successfully'
          });
        } else {
          throw new Error('Failed to delete video');
        }
      } catch (error) {
        console.error('Error deleting video:', error);
        toast({
          title: 'Error',
          description: 'Failed to delete video. Please try again.',
          variant: 'destructive'
        });
      }
    }
  };
  
  const filteredVideos = videos.filter(video => {
    // Filter by tags if any are selected
    const tagFilter = selectedTags.length === 0 || 
      video.tags.some(tag => selectedTags.includes(tag.id));
    
    // Filter by search term if provided
    const searchFilter = !searchTerm || 
      (video.title && video.title.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (video.description && video.description.toLowerCase().includes(searchTerm.toLowerCase()));
    
    return tagFilter && searchFilter;
  });
  
  const getVideoIdFromUrl = (url: string) => {
    // Extract video ID from YouTube embed URL
    return url.split('/').pop()?.split('?')[0] || '';
  };
  
  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  if (!user) {
    router.push('/');
    return null;
  }
  
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">My Videos</h1>
        
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search videos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
            {searchTerm && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1.5 h-7 w-7"
                onClick={() => setSearchTerm('')}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
          
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" className="flex items-center gap-2">
                <FilterIcon className="h-4 w-4" />
                <span>Filter</span>
                {selectedTags.length > 0 && (
                  <Badge variant="secondary" className="ml-1">
                    {selectedTags.length}
                  </Badge>
                )}
              </Button>
            </SheetTrigger>
            <SheetContent>
              <SheetHeader>
                <SheetTitle>Filter Videos</SheetTitle>
                <SheetDescription>
                  Select tags to filter your videos
                </SheetDescription>
              </SheetHeader>
              
              <div className="py-4">
                <h3 className="text-sm font-medium mb-2">Tags</h3>
                <div className="flex flex-wrap gap-2">
                  {allTags.map(tag => (
                    <Badge
                      key={tag.id}
                      variant={selectedTags.includes(tag.id) ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => handleTagClick(tag.id)}
                    >
                      <TagIcon className="mr-1 h-3 w-3" />
                      {tag.name}
                    </Badge>
                  ))}
                  
                  {allTags.length === 0 && (
                    <p className="text-sm text-muted-foreground">
                      No tags found. Add tags when uploading videos.
                    </p>
                  )}
                </div>
              </div>
              
              <SheetFooter>
                <SheetClose asChild>
                  <Button variant="outline" onClick={clearFilters}>Clear Filters</Button>
                </SheetClose>
                <SheetClose asChild>
                  <Button>Apply Filters</Button>
                </SheetClose>
              </SheetFooter>
            </SheetContent>
          </Sheet>
        </div>
      </div>
      
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2">Loading videos...</span>
        </div>
      ) : filteredVideos.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="rounded-full bg-muted p-3">
              <TagIcon className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="mt-4 text-lg font-medium">No videos found</h3>
            <p className="mt-2 text-sm text-muted-foreground text-center max-w-sm">
              {videos.length === 0 
                ? "You haven't added any videos yet. Add videos from your daily journal."
                : "No videos match the selected filters. Try changing or clearing your filters."}
            </p>
            {videos.length > 0 && selectedTags.length > 0 && (
              <Button variant="outline" className="mt-4" onClick={clearFilters}>
                Clear Filters
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredVideos.map(video => (
            <Card key={video.id} className="overflow-hidden h-full flex flex-col">
              <div className="aspect-video">
                <YoutubeEmbed embedId={getVideoIdFromUrl(video.url)} />
              </div>
              <CardContent className="flex-1 flex flex-col p-4">
                <h3 className="font-medium text-lg line-clamp-1">
                  {video.title || 'Untitled Video'}
                </h3>
                {video.description && (
                  <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                    {video.description}
                  </p>
                )}
                
                <div className="mt-2 flex flex-wrap gap-1">
                  {video.tags.map(tag => (
                    <Badge key={tag.id} variant="secondary" className="text-xs">
                      {tag.name}
                    </Badge>
                  ))}
                  
                  {video.tags.length === 0 && (
                    <span className="text-xs text-muted-foreground">No tags</span>
                  )}
                </div>
                
                <div className="mt-auto pt-3 flex items-center justify-between text-xs text-muted-foreground">
                  <span>
                    Added on {format(new Date(video.created_at), 'MMM d, yyyy')}
                  </span>
                  
                  <Button
                    variant="ghost" 
                    size="sm"
                    className="text-destructive hover:text-destructive"
                    onClick={() => handleDeleteVideo(video.id)}
                  >
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
} 