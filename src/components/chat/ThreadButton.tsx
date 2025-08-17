import React from 'react';
import { MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ThreadButtonProps {
  threadCount: number;
  onThreadClick: () => void;
  isExpanded: boolean;
}

export const ThreadButton: React.FC<ThreadButtonProps> = ({ 
  threadCount, 
  onThreadClick, 
  isExpanded 
}) => {
  if (threadCount === 0) return null;

  return (
    <Button 
      variant="ghost" 
      size="sm" 
      onClick={onThreadClick}
      className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
    >
      <MessageSquare className="h-3 w-3 mr-1" />
      {threadCount} {threadCount === 1 ? 'Antwort' : 'Antworten'}
      {isExpanded ? ' weniger' : ' anzeigen'}
    </Button>
  );
};