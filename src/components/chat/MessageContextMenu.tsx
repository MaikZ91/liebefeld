
import React from 'react';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
  ContextMenuSeparator,
} from '@/components/ui/context-menu';
import EmojiPicker from './EmojiPicker';
import { Button } from '@/components/ui/button';

interface MessageContextMenuProps {
  children: React.ReactNode;
  onReact: (emoji: string) => void;
}

const quickReactions = ['👍', '❤️', '😂', '😮', '😢', '😡'];

const MessageContextMenu: React.FC<MessageContextMenuProps> = ({
  children,
  onReact
}) => {
  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        {children}
      </ContextMenuTrigger>
      <ContextMenuContent className="w-64 bg-gray-900 border-gray-700 p-2">
        <div className="mb-2">
          <div className="text-xs text-gray-400 mb-2 px-2">Schnelle Reaktionen</div>
          <div className="flex gap-1 justify-center">
            {quickReactions.map((emoji) => (
              <Button
                key={emoji}
                variant="ghost"
                className="h-10 w-10 p-0 text-lg hover:bg-gray-800 transition-colors"
                onClick={() => onReact(emoji)}
              >
                {emoji}
              </Button>
            ))}
          </div>
        </div>
        
        <ContextMenuSeparator className="bg-gray-700" />
        
        <ContextMenuItem className="p-0 focus:bg-transparent">
          <EmojiPicker
            onEmojiSelect={onReact}
            trigger={
              <Button
                variant="ghost"
                className="w-full justify-start text-gray-300 hover:bg-gray-800 h-8"
              >
                Alle Emojis anzeigen...
              </Button>
            }
          />
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
};

export default MessageContextMenu;
