// Component to show reply preview in the message input area
import React from 'react';
import { Button } from '@/components/ui/button';
import { X, Reply } from 'lucide-react';
import { ReplyData } from '@/hooks/chat/useReplySystem';

interface ReplyPreviewProps {
  replyTo: ReplyData;
  onCancel: () => void;
}

const ReplyPreview: React.FC<ReplyPreviewProps> = ({ replyTo, onCancel }) => {
  console.log('ReplyPreview rendered with replyTo:', replyTo);
  
  const formatText = (text: string) => {
    if (text.length <= 50) return text;
    return text.substring(0, 50) + '...';
  };

  return (
    <div className="bg-white/10 backdrop-blur border border-white/20 rounded-lg p-3 mb-2 flex items-start gap-3">
      <Reply className="h-4 w-4 text-primary mt-1 flex-shrink-0" />
      
      <div className="flex-1 min-w-0">
        <div className="text-xs text-gray-300 mb-1">
          Antwort an {replyTo.sender}
        </div>
        <div className="text-sm text-gray-400 italic">
          {formatText(replyTo.text)}
        </div>
      </div>
      
      <Button
        variant="ghost"
        size="sm"
        onClick={onCancel}
        className="h-6 w-6 p-0 text-gray-400 hover:text-white flex-shrink-0 hover:bg-white/10"
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
};

export default ReplyPreview;