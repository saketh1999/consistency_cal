'use client';

import type { FC } from 'react';

interface YoutubeEmbedProps {
  embedId: string;
}

const YoutubeEmbed: FC<YoutubeEmbedProps> = ({ embedId }) => {
  if (!embedId) return null;

  return (
    <div className="aspect-video w-full overflow-hidden rounded-lg shadow-md">
      <iframe
        src={`https://www.youtube.com/embed/${embedId}`}
        title="YouTube video player"
        frameBorder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
        className="h-full w-full"
      ></iframe>
    </div>
  );
};

export default YoutubeEmbed;
