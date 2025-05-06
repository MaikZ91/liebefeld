
import React from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Users, Info, Search, MoreVertical } from 'lucide-react';
import { getInitials } from '@/utils/chatUIUtils';

interface ChatHeaderProps {
  title: string;
  description?: string;
  avatar?: string;
  isGroup?: boolean;
  onUserListClick?: () => void;
}

const ChatHeader: React.FC<ChatHeaderProps> = ({
  title,
  description,
  avatar,
  isGroup = false,
  onUserListClick
}) => {
  const isMobile = useIsMobile();

  return (
    <div className="flex items-center justify-between p-2 border-b border-gray-200 dark:border-gray-800 bg-[#f0f2f5] dark:bg-[#202c33]">
      <div className="flex items-center gap-3">
        <Avatar className="h-10 w-10 border-2 border-transparent">
          <AvatarImage src={avatar} alt={title} />
          <AvatarFallback className={`${isGroup ? 'bg-green-500' : 'bg-blue-500'} text-white`}>
            {getInitials(title)}
          </AvatarFallback>
        </Avatar>
        <div>
          <h2 className="font-semibold text-gray-800 dark:text-white">{title}</h2>
          {description && (
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {description}
            </p>
          )}
        </div>
      </div>
      
      <div className="flex items-center">
        <Button
          variant="ghost"
          size="icon"
          className="text-gray-600 dark:text-gray-300 rounded-full"
        >
          <Search className="h-5 w-5" />
          <span className="sr-only">Search</span>
        </Button>
        
        {isGroup && onUserListClick && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onUserListClick}
            className="text-gray-600 dark:text-gray-300 rounded-full"
          >
            <Users className="h-5 w-5" />
            <span className="sr-only">Users</span>
          </Button>
        )}
        
        <Button
          variant="ghost"
          size="icon"
          className="text-gray-600 dark:text-gray-300 rounded-full"
        >
          <MoreVertical className="h-5 w-5" />
          <span className="sr-only">More options</span>
        </Button>
      </div>
    </div>
  );
};

export default ChatHeader;
