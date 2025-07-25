import React from 'react';
import { cn } from '@/lib/utils';

interface MentionRendererProps {
  text: string;
  currentUsername?: string;
  className?: string;
}

const MentionRenderer: React.FC<MentionRendererProps> = ({
  text,
  currentUsername,
  className
}) => {
  // Split text by mentions and render with highlighting
  const renderTextWithMentions = (text: string) => {
    const mentionRegex = /@(\w+)/g;
    const parts = text.split(mentionRegex);
    const result = [];
    
    for (let i = 0; i < parts.length; i++) {
      if (i % 2 === 0) {
        // Regular text
        if (parts[i]) {
          result.push(parts[i]);
        }
      } else {
        // This is a username from a mention
        const mentionedUser = parts[i];
        const isCurrentUser = mentionedUser === currentUsername;
        
        result.push(
          <span
            key={`mention-${i}`}
            className={cn(
              "font-medium px-1 py-0.5 rounded text-sm",
              isCurrentUser 
                ? "bg-blue-500 text-white" 
                : "bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400"
            )}
          >
            @{mentionedUser}
          </span>
        );
      }
    }
    
    return result;
  };

  return (
    <span className={cn("whitespace-pre-wrap", className)}>
      {renderTextWithMentions(text)}
    </span>
  );
};

export default MentionRenderer;