import React from 'react';
import { getChannelColor } from '@/utils/channelColors';
import { LinkIcon } from 'lucide-react';

export const colorizeHashtags = (text: string): React.ReactNode => {
  // First handle URLs and links
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const urlMatches: string[] = text.match(urlRegex) || [];
  let parts: string[] = [text];

  // Split by URLs first
  if (urlMatches.length > 0) {
    parts = text.split(urlRegex);
  }

  return parts.map((part, partIndex) => {
    // Check if this part is a URL
    const isUrl = urlMatches.includes(part);
    
    if (isUrl) {
      return (
        <a
          key={`url-${partIndex}`}
          href={part}
          target="_blank"
          rel="noopener noreferrer"
          className="text-red-400 hover:text-red-300 underline break-all inline-flex items-center"
        >
          {part}
          <LinkIcon className="h-3 w-3 ml-1 inline" />
        </a>
      );
    }

    // For non-URL parts, colorize hashtags
    const hashtagParts = part.split(/(#(?:sport|kreativität|ausgehen))/gi);
    
    return hashtagParts.map((hashtagPart, hashtagIndex) => {
      const lowerPart = hashtagPart.toLowerCase();
      
      if (lowerPart === '#sport') {
        return (
          <span key={`hashtag-${partIndex}-${hashtagIndex}`} style={getChannelColor('sport').textStyle}>
            {hashtagPart}
          </span>
        );
      } else if (lowerPart === '#kreativität') {
        return (
          <span key={`hashtag-${partIndex}-${hashtagIndex}`} style={getChannelColor('kreativität').textStyle}>
            {hashtagPart}
          </span>
        );
      } else if (lowerPart === '#ausgehen') {
        return (
          <span key={`hashtag-${partIndex}-${hashtagIndex}`} style={getChannelColor('ausgehen').textStyle}>
            {hashtagPart}
          </span>
        );
      }
      
      return hashtagPart;
    });
  });
};
