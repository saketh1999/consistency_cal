'use client';

import { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { VideoIcon, GripVertical, Trash2Icon, PlusCircleIcon } from 'lucide-react';
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
}

const VideoModule = ({ 
  videoUrls, 
  onVideoUrlsChange,
  defaultOpen = true,
  initialExpanded = false 
}: VideoModuleProps) => {
  const [isOpen, setIsOpen] = useState<boolean>(initialExpanded);
  const [currentVideoUrlInput, setCurrentVideoUrlInput] = useState('');
  const { toast } = useToast();

  const extractYoutubeEmbedId = (url: string): string | null => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const handleAddVideoUrl = () => {
    if (currentVideoUrlInput.trim()) {
      if (extractYoutubeEmbedId(currentVideoUrlInput.trim())) {
        onVideoUrlsChange([...videoUrls, currentVideoUrlInput.trim()]);
        setCurrentVideoUrlInput('');
      } else {
        toast({
          title: "Invalid YouTube URL",
          description: "Please enter a valid YouTube video URL.",
          variant: "destructive",
        });
      }
    }
  };

  const handleRemoveVideoUrl = (index: number) => {
    const newVideoUrls = videoUrls.filter((_, i) => i !== index);
    onVideoUrlsChange(newVideoUrls);
  };

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} defaultOpen={defaultOpen} className="relative w-full bg-card rounded-md">
      <div className="flex items-center justify-between p-3 border-b border-border">
        <div className="flex items-center gap-2">
          <GripVertical className="h-5 w-5 text-muted-foreground cursor-grab" />
          <Label htmlFor="videoUrlInput" className="flex items-center gap-2 font-medium text-primary cursor-pointer">
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
          <div className="flex gap-2">
            <Input
              id="videoUrlInput"
              type="url"
              placeholder="Add YouTube video URL..."
              value={currentVideoUrlInput}
              onChange={(e) => setCurrentVideoUrlInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAddVideoUrl()}
              className="flex-grow bg-input text-foreground placeholder-muted-foreground"
            />
            <Button 
              onClick={handleAddVideoUrl} 
              variant="outline" 
              size="icon" 
              aria-label="Add video URL" 
              className="border-primary text-primary hover:bg-primary/10"
            >
              <PlusCircleIcon className="h-5 w-5" />
            </Button>
          </div>
          
          {videoUrls.length > 0 ? (
            <ScrollArea className="max-h-60">
              <div className="space-y-3 pr-4">
                {videoUrls.map((url, index) => {
                  const embedId = extractYoutubeEmbedId(url);
                  return (
                    <div key={index} className="p-2 rounded-md border border-border bg-background/30">
                      <div className="flex justify-between items-center mb-1.5">
                        <a href={url} target="_blank" rel="noopener noreferrer" className="text-sm text-accent hover:underline truncate" title={url}>
                          {url}
                        </a>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => handleRemoveVideoUrl(index)} 
                          aria-label="Remove video URL" 
                          className="text-destructive/70 hover:text-destructive"
                        >
                          <Trash2Icon className="h-4 w-4" />
                        </Button>
                      </div>
                      {embedId ? (
                        <YoutubeEmbed embedId={embedId} />
                      ) : (
                        <p className="text-xs text-destructive">Invalid YouTube URL or embed ID not found.</p>
                      )}
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          ) : (
            <div className="flex flex-col items-center justify-center py-4 text-center bg-muted/20 rounded-md">
              <VideoIcon className="h-8 w-8 text-muted-foreground mb-2 opacity-50" />
              <p className="text-sm text-muted-foreground">No videos added yet</p>
            </div>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
};

export default VideoModule; 