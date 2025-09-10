
import React from 'react';
import { RefreshCw, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getChannelColor } from '@/utils/channelColors';

interface ChatHeaderProps {
  groupName: string;
  isReconnecting: boolean;
  handleReconnect: () => void;
  onOpenUserDirectory?: () => void;
  isGroup?: boolean;
  compact?: boolean;
  groupType?: 'ausgehen' | 'sport' | 'kreativität';
}

const ChatHeader: React.FC<ChatHeaderProps> = ({
  groupName,
  isReconnecting,
  handleReconnect,
  onOpenUserDirectory,
  isGroup = false,
  compact = false,
  groupType = 'ausgehen'
}) => {
  const channelColors = getChannelColor(groupType);
  return (
    <div 
      className="px-4 py-3 text-white flex items-center justify-between"
      style={{
        background: channelColors.primary,
        borderBottom: `1px solid ${channelColors.borderStyle.borderColor}`
      }}
    >
      <h3 className="text-xl font-bold text-white">{groupName}</h3>
      <div className="flex items-center space-x-2">
        {onOpenUserDirectory && (
          <Button 
            variant="outline" 
            size="icon"
            onClick={onOpenUserDirectory}
            className="border-white/20 text-white hover:bg-white/10 bg-transparent"
            title="Benutzerverzeichnis öffnen"
          >
            <Users className="h-5 w-5" />
          </Button>
        )}
        {isReconnecting ? (
          <Button variant="secondary" disabled size="sm" className="bg-white/10">
            <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
            Verbinde...
          </Button>
        ) : (
          <Button 
            variant="outline" 
            size="icon" 
            onClick={handleReconnect} 
            title="Neu verbinden"
            className="border-white/20 text-white hover:bg-white/10 bg-transparent"
          >
            <RefreshCw className="h-5 w-5" />
          </Button>
        )}
      </div>
    </div>
  );
};

export default ChatHeader;
