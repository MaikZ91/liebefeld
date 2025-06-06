
import React from 'react';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from '@/components/ui/context-menu';
import { Smile, ThumbsUp, Heart, Laugh, Angry } from 'lucide-react';

interface MessageContextMenuProps {
  children: React.ReactNode;
  onReact: (emoji: string) => void;
}

const reactionEmojis = [
  { emoji: '👍', icon: ThumbsUp, label: 'Daumen hoch' },
  { emoji: '❤️', icon: Heart, label: 'Herz' },
  { emoji: '😂', icon: Laugh, label: 'Lachen' },
  { emoji: '😮', icon: Smile, label: 'Überrascht' },
  { emoji: '😢', icon: Angry, label: 'Traurig' },
  { emoji: '😡', icon: Angry, label: 'Wütend' },
];

const MessageContextMenu: React.FC<MessageContextMenuProps> = ({
  children,
  onReact
}) => {
  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        {children}
      </ContextMenuTrigger>
      <ContextMenuContent className="w-48 bg-black border-gray-700">
        <div className="p-2">
          <div className="text-xs text-gray-400 mb-2">Reaktion hinzufügen</div>
          <div className="grid grid-cols-3 gap-2">
            {reactionEmojis.map((reaction) => (
              <ContextMenuItem
                key={reaction.emoji}
                onClick={() => onReact(reaction.emoji)}
                className="flex items-center justify-center p-2 rounded hover:bg-gray-800 cursor-pointer"
              >
                <span className="text-lg">{reaction.emoji}</span>
              </ContextMenuItem>
            ))}
          </div>
        </div>
      </ContextMenuContent>
    </ContextMenu>
  );
};

export default MessageContextMenu;
