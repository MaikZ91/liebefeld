
import React from 'react';
import { RefreshCw, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ChatHeaderProps {
  groupName: string;
  isReconnecting: boolean;
  handleReconnect: () => void;
  compact?: boolean;
  isSpotGroup?: boolean;
  isSportGroup?: boolean;
  isAusgehenGroup?: boolean;
}

const ChatHeader: React.FC<ChatHeaderProps> = ({
  groupName,
  isReconnecting,
  handleReconnect,
  compact = false,
  isSpotGroup = false,
  isSportGroup = false,
  isAusgehenGroup = false
}) => {
  return (
    <div className={`px-4 py-3 ${isSpotGroup || isSportGroup || isAusgehenGroup ? 'bg-[#1A1F2C]' : 'bg-gray-900'} text-white flex items-center justify-between`}>
      {!compact && <h3 className="text-xl font-bold">{groupName}</h3>}
      <div className="flex items-center space-x-2">
        {isReconnecting && (
          <Button variant="secondary" disabled>
            <RefreshCw className="mr-2 h-5 w-5 animate-spin" />
            Reconnecting...
          </Button>
        )}
        <Button variant="outline" size="icon" onClick={handleReconnect}>
          <RefreshCw className="h-5 w-5" />
        </Button>
        {!compact && <Users className="h-6 w-6" />}
      </div>
    </div>
  );
};

export default ChatHeader;
