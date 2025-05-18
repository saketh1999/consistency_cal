'use client';

import type { FC } from 'react';
import { AspectRatio } from '@/components/ui/aspect-ratio';

interface YoutubeEmbedProps {
  embedId: string;
}

const YoutubeEmbed: FC<YoutubeEmbedProps> = ({ embedId }) => {
  if (!embedId) return null;

  return (
    <div className="relative w-full pt-[56.25%]">
      <iframe
        className="absolute top-0 left-0 w-full h-full rounded-md"
        src={`https://www.youtube.com/embed/${embedId}`}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        title="Embedded youtube"
      />
    </div>
  );
};

export default YoutubeEmbed;
