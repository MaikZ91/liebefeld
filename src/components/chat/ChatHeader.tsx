
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
      className="px-6 py-4 text-white flex items-center justify-between premium-header"
      style={{
        background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.95) 0%, rgba(0, 0, 0, 0.9) 100%)',
        borderBottom: `1px solid rgba(255, 255, 255, 0.1)`
      }}
    >
      <h3 className="text-xl font-bold text-white tracking-wide">{groupName}</h3>
      <div className="flex items-center space-x-2">
        {onOpenUserDirectory && (
          <Button 
            variant="outline" 
            size="icon"
            onClick={onOpenUserDirectory}
            className="border-white/30 text-white hover:bg-white/15 bg-white/5 backdrop-blur-sm transition-all duration-200"
            title="Benutzerverzeichnis öffnen"
          >
            <Users className="h-5 w-5" />
          </Button>
        )}
        {isReconnecting ? (
          <Button variant="secondary" disabled size="sm" className="bg-white/15 backdrop-blur-sm">
            <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
            Verbinde...
          </Button>
        ) : (
          <Button 
            variant="outline" 
            size="icon" 
            onClick={handleReconnect} 
            title="Neu verbinden"
            className="border-white/30 text-white hover:bg-white/15 bg-white/5 backdrop-blur-sm transition-all duration-200"
          >
            <RefreshCw className="h-5 w-5" />
          </Button>
        )}
      </div>
    </div>
  );
};

export default ChatHeader;
