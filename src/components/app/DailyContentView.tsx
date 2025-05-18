'use client';

import type { FC } from 'react';
import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import type { DailyData } from '@/lib/types';
import YoutubeEmbed from './YoutubeEmbed';
import { format } from 'date-fns';
import { ImageIcon, VideoIcon, NotebookTextIcon } from 'lucide-react';

interface DailyContentViewProps {
  selectedDate: Date | undefined;
  data: DailyData | undefined;
  onDataChange: (dateKey: string, newDailyData: DailyData) => void;
}

const DailyContentView: FC<DailyContentViewProps> = ({ selectedDate, data, onDataChange }) => {
  const [notes, setNotes] = useState(data?.notes || '');
  const [imageUrl, setImageUrl] = useState(data?.imageUrl || '');
  const [videoUrl, setVideoUrl] = useState(data?.videoUrl || '');
  const [youtubeEmbedId, setYoutubeEmbedId] = useState<string | null>(null);

  useEffect(() => {
    setNotes(data?.notes || '');
    setImageUrl(data?.imageUrl || '');
    setVideoUrl(data?.videoUrl || '');
    if (data?.videoUrl) {
      extractYoutubeEmbedId(data.videoUrl);
    } else {
      setYoutubeEmbedId(null);
    }
  }, [data, selectedDate]);

  const extractYoutubeEmbedId = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    setYoutubeEmbedId((match && match[2].length === 11) ? match[2] : null);
  };

  const handleSave = () => {
    if (selectedDate) {
      const dateKey = format(selectedDate, 'yyyy-MM-dd');
      onDataChange(dateKey, { notes, imageUrl, videoUrl });
    }
  };
  
  const handleVideoUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newUrl = e.target.value;
    setVideoUrl(newUrl);
    extractYoutubeEmbedId(newUrl);
  }

  if (!selectedDate) {
    return (
      <Card className="flex h-full items-center justify-center shadow-lg">
        <CardContent>
          <p className="text-muted-foreground">Select a date to view or add content.</p>
        </CardContent>
      </Card>
    );
  }

  const formattedDate = format(selectedDate, 'MMMM do, yyyy');

  return (
    <Card className="shadow-lg h-full flex flex-col">
      <CardHeader>
        <CardTitle className="text-xl font-semibold">Journal for {formattedDate}</CardTitle>
        <CardDescription>Log your activities, meals, and thoughts for the day.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6 flex-grow overflow-y-auto p-4 md:p-6">
        <div className="space-y-2">
          <Label htmlFor="notes" className="flex items-center gap-2 font-medium">
            <NotebookTextIcon className="h-5 w-5 text-primary" />
            Notes
          </Label>
          <Textarea
            id="notes"
            placeholder="How was your day? What did you achieve?"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="min-h-[120px] resize-none"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="imageUrl" className="flex items-center gap-2 font-medium">
            <ImageIcon className="h-5 w-5 text-primary" />
            Image URL
          </Label>
          <Input
            id="imageUrl"
            type="url"
            placeholder="https://example.com/image.jpg or paste a link to your progress pic!"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
          />
          {imageUrl && (
            <div className="mt-2 overflow-hidden rounded-lg border shadow-sm">
              <Image
                src={imageUrl}
                alt="User uploaded content"
                width={600}
                height={400}
                className="aspect-[3/2] w-full object-cover"
                data-ai-hint="fitness progress"
                onError={(e) => e.currentTarget.src = `https://placehold.co/600x400.png?text=Invalid+Image`} 
              />
            </div>
          )}
           {!imageUrl && (
             <div className="mt-2 overflow-hidden rounded-lg border shadow-sm">
                <Image
                    src={`https://placehold.co/600x400.png`}
                    alt="Placeholder image"
                    width={600}
                    height={400}
                    className="aspect-[3/2] w-full object-cover"
                    data-ai-hint="fitness activity"
                />
            </div>
           )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="videoUrl" className="flex items-center gap-2 font-medium">
             <VideoIcon className="h-5 w-5 text-primary" />
            YouTube Video URL
          </Label>
          <Input
            id="videoUrl"
            type="url"
            placeholder="https://www.youtube.com/watch?v=your_video_id"
            value={videoUrl}
            onChange={handleVideoUrlChange}
          />
          {youtubeEmbedId && (
            <div className="mt-2">
              <YoutubeEmbed embedId={youtubeEmbedId} />
            </div>
          )}
        </div>
        <Button onClick={handleSave} className="w-full bg-accent hover:bg-accent/90 text-accent-foreground">
          Save Journal
        </Button>
      </CardContent>
    </Card>
  );
};

export default DailyContentView;
