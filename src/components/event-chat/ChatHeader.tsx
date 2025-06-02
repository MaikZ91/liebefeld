
import React from 'react';
import { Button } from '@/components/ui/button';
import { MessageCircle, X, ChevronDown, Download, Trash2 } from 'lucide-react';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuLabel, DropdownMenuGroup, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { ChatHeaderProps } from './types';

const ChatHeader: React.FC<ChatHeaderProps> = ({ 
  activeChatModeValue, 
  handleToggleChat, 
  exportChatHistory, 
  clearChatHistory 
}) => {
  return (
    <div className="flex items-center justify-between p-3 border-b border-black bg-red-950/30 rounded-t-lg">
      <div className="flex items-center">
        <MessageCircle className="h-5 w-5 text-red-500 mr-2" />
        <h3 className="font-medium text-red-500">
          {activeChatModeValue === 'ai' ? 'Event-Assistent' : 'Community-Chat'}
        </h3>
      </div>
      <div className="flex items-center space-x-1">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-6 w-6 bg-gray-800 text-white hover:bg-gray-700 p-1">
              <ChevronDown className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="bg-gray-800 border-black text-white">
            <DropdownMenuLabel>Chat-Verlauf</DropdownMenuLabel>
            <DropdownMenuGroup>
              <DropdownMenuItem onClick={exportChatHistory} className="cursor-pointer">
                <Download className="mr-2 h-4 w-4" />
                <span>Exportieren</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={clearChatHistory} className="cursor-pointer text-red-400">
                <Trash2 className="mr-2 h-4 w-4" />
                <span>Löschen</span>
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
        <Button
          onClick={handleToggleChat}
          className="h-6 w-6 p-1 text-red-400 hover:text-red-300 transition-colors bg-transparent hover:bg-transparent"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default ChatHeader;
