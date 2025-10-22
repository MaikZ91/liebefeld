import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';

interface StreamingChatMessageProps {
  content: string;
  isStreaming: boolean;
}

export const StreamingChatMessage: React.FC<StreamingChatMessageProps> = ({
  content,
  isStreaming
}) => {
  const [displayedContent, setDisplayedContent] = useState('');

  useEffect(() => {
    if (isStreaming) {
      setDisplayedContent(content);
    } else {
      setDisplayedContent(content);
    }
  }, [content, isStreaming]);

  return (
    <Card className="bg-black/40 border-white/10 p-4 animate-fade-in">
      <div 
        className="text-foreground prose prose-invert max-w-none"
        dangerouslySetInnerHTML={{ __html: displayedContent }}
      />
      {isStreaming && (
        <span className="inline-block w-2 h-4 ml-1 bg-primary animate-pulse"></span>
      )}
    </Card>
  );
};
