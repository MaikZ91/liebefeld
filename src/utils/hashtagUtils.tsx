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

    // Remove category tags like [SPORT], [AUSGEHEN], [KREATIVITÄT] but keep color coding
    let displayText = part;
    let categoryType: 'sport' | 'kreativität' | 'ausgehen' | null = null;
    
    // Check for category tags and extract them
    const categoryTagMatch = part.match(/^\[([A-ZÄÖÜ]+)\]\s*/);
    if (categoryTagMatch) {
      const categoryName = categoryTagMatch[1].toLowerCase();
      displayText = part.replace(/^\[[A-ZÄÖÜ]+\]\s*/, ''); // Remove the tag
      
      if (categoryName === 'sport') categoryType = 'sport';
      else if (categoryName === 'kreativität') categoryType = 'kreativität';
      else if (categoryName === 'ausgehen') categoryType = 'ausgehen';
    }

    // Apply color styling based on category type
    if (categoryType) {
      const colors = getChannelColor(categoryType);
      return (
        <span key={`category-${partIndex}`} style={colors.textStyle}>
          {displayText}
        </span>
      );
    }
    
    return displayText;
  });
};
