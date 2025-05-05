
import React from 'react';
import { RefreshCw, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ChatHeaderProps {
  groupName: string;
  isReconnecting: boolean;
  handleReconnect: () => void;
  isGroup?: boolean;
  compact?: boolean;
}

const ChatHeader: React.FC<ChatHeaderProps> = ({
  groupName,
  isReconnecting,
  handleReconnect,
  isGroup = false,
  compact = false
}) => {
  return (
    <div className={`px-4 py-3 ${isGroup ? 'bg-black' : 'bg-black'} text-white flex items-center justify-between border-b border-gray-800`}>
      <h3 className="text-xl font-bold">{groupName}</h3>
      <div className="flex items-center space-x-2">
        {isReconnecting ? (
          <Button variant="secondary" disabled size="sm">
            <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
            Verbinde...
          </Button>
        ) : (
          <Button variant="outline" size="icon" onClick={handleReconnect} title="Neu verbinden">
            <RefreshCw className="h-5 w-5" />
          </Button>
        )}
      </div>
    </div>
  );
};

export default ChatHeader;
