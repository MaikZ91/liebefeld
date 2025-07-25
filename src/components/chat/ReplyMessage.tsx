import React from 'react';
import { Reply } from 'lucide-react';
import { Message } from '@/types/chatTypes';
import { cn } from '@/lib/utils';
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

interface ReplyMessageProps {
  replyToMessage: Message;
  className?: string;
}

const ReplyMessage: React.FC<ReplyMessageProps> = ({ replyToMessage, className }) => {
  return (
    <div className={cn(
      "flex items-center gap-2 p-2 mb-2 bg-gray-100 dark:bg-gray-800/50 rounded-lg border-l-4 border-blue-500",
      className
    )}>
      <Reply className="h-3 w-3 text-blue-500 flex-shrink-0" />
      <Avatar className="h-5 w-5 flex-shrink-0">
        <AvatarImage src={replyToMessage.user_avatar} />
        <AvatarFallback className="text-xs">
          {replyToMessage.user_name.charAt(0).toUpperCase()}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <div className="text-xs font-medium text-blue-600 dark:text-blue-400">
          {replyToMessage.user_name}
        </div>
        <div className="text-xs text-gray-600 dark:text-gray-300 truncate">
          {replyToMessage.text}
        </div>
      </div>
    </div>
  );
};

export default ReplyMessage;