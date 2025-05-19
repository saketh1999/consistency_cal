'use client';

import { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { VideoIcon, GripVertical, Trash2Icon, PlusCircleIcon, XCircleIcon } from 'lucide-react';
import { 
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import YoutubeEmbed from '../YoutubeEmbed';

interface VideoModuleProps {
  videoUrls: string[];
  onVideoUrlsChange: (urls: string[]) => void;
  defaultOpen?: boolean;
  initialExpanded?: boolean;
  isReadOnly?: boolean;
}

const VideoModule = ({ 
  videoUrls, 
  onVideoUrlsChange,
  defaultOpen = true,
  initialExpanded = false,
  isReadOnly = false
}: VideoModuleProps) => {
  const [isOpen, setIsOpen] = useState<boolean>(initialExpanded);
  const [videoUrl, setVideoUrl] = useState<string>('');
  const { toast } = useToast();

  const handleAddVideo = () => {
    if (isReadOnly) return;
    
    try {
      const url = videoUrl.trim();
      if (!url) {
        toast({ title: "Error", description: "Please enter a YouTube URL", variant: "destructive" });
        return;
      }
      
      let videoId = '';
      
      if (url.includes('youtube.com/watch?v=')) {
        const urlObj = new URL(url);
        videoId = urlObj.searchParams.get('v') || '';
      } else if (url.includes('youtu.be/')) {
        videoId = url.split('youtu.be/')[1]?.split(/[?&]/)[0] || '';
      } else if (url.includes('youtube.com/embed/')) {
        videoId = url.split('youtube.com/embed/')[1]?.split(/[?&]/)[0] || '';
      }
      
      if (!videoId) {
        toast({ title: "Error", description: "Invalid YouTube URL format. Please use a standard YouTube share link.", variant: "destructive" });
        return;
      }
      
      const embedUrl = `https://www.youtube.com/embed/${videoId}`;
      
      if (videoUrls.includes(embedUrl)) {
        toast({ title: "Error", description: "This video has already been added", variant: "destructive" });
        return;
      }
      
      onVideoUrlsChange([...videoUrls, embedUrl]);
      setVideoUrl('');
      
      toast({ title: "Success", description: "Video added successfully" });
    } catch (error) {
      toast({ title: "Error", description: "Failed to process YouTube URL", variant: "destructive" });
    }
  };

  const handleRemoveVideo = (index: number) => {
    if (isReadOnly) return;
    
    const newVideoUrls = [...videoUrls];
    newVideoUrls.splice(index, 1);
    onVideoUrlsChange(newVideoUrls);
    toast({ title: "Success", description: "Video removed" });
  };

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} defaultOpen={defaultOpen} className="relative w-full bg-card rounded-md">
      <div className="flex items-center justify-between p-3 border-b border-border">
        <div className="flex items-center gap-2">
          {!isReadOnly && <GripVertical className="h-5 w-5 text-muted-foreground cursor-grab" />}
          <Label htmlFor="videoUrlTrigger" className="flex items-center gap-2 font-medium text-primary cursor-pointer">
            <VideoIcon className="h-5 w-5" />
            YouTube Videos ({videoUrls.length})
          </Label>
        </div>
        
        <CollapsibleTrigger asChild>
          <Button variant="ghost" size="sm" className="h-9 w-9 p-0 text-muted-foreground">
            <span className="sr-only">Toggle</span>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className={`h-4 w-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
            >
              <path d="m18 15-6-6-6 6" />
            </svg>
          </Button>
        </CollapsibleTrigger>
      </div>
      
      <CollapsibleContent>
        <div className="p-3 space-y-3">
          {!isReadOnly && (
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
              <Input 
                placeholder="Paste YouTube URL here" 
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                className="flex-grow"
              />
              <Button 
                variant="outline" 
                className="whitespace-nowrap border-primary text-primary hover:bg-primary/10"
                onClick={handleAddVideo}
              >
                <PlusCircleIcon className="mr-2 h-4 w-4" /> Add Video
              </Button>
            </div>
          )}
          
          {videoUrls.length === 0 ? (
            <div className="flex flex-col items-center justify-center min-h-[100px] p-4 bg-muted/20 rounded-md">
              <p className="text-sm text-muted-foreground">
                {isReadOnly 
                  ? "No videos available for this date." 
                  : "Add YouTube videos to display them here."}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {videoUrls.map((url, index) => (
                <div key={index} className="relative rounded-md border border-border overflow-hidden bg-black">
                  <div className="aspect-video">
                    <iframe 
                      src={url} 
                      title={`YouTube video ${index + 1}`}
                      className="w-full h-full"
                      frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                  {!isReadOnly && (
                    <Button
                      variant="destructive"
                      size="icon"
                      onClick={() => handleRemoveVideo(index)}
                      aria-label={`Remove video ${index + 1}`}
                      className="absolute top-2 right-2 h-7 w-7 bg-black/50 hover:bg-destructive/80 border-destructive/50"
                    >
                      <XCircleIcon className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
};

export default VideoModule; 