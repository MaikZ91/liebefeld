// src/components/chat/MessageReactions.tsx

import React from 'react';
import ReactionBar from './ReactionBar';
import EmojiPicker from './EmojiPicker';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

interface MessageReactionsProps {
  reactions: { emoji: string; users: string[] }[];
  onReact: (emoji: string) => void;
  currentUsername: string;
  showAddButton?: boolean;
}

const MessageReactions: React.FC<MessageReactionsProps> = ({
  reactions,
  onReact,
  currentUsername,
  showAddButton = true
}) => {
  const hasReactions = reactions && reactions.length > 0;

  return (
    // Entfernen Sie flex items-start gap-2 mt-1, da die Positionierung jetzt von ChatMessage übernommen wird
    <div className="flex items-center gap-1"> {/* Angepasst für kompaktere Darstellung */}
      {hasReactions && (
        <ReactionBar
          reactions={reactions}
          onReact={onReact}
          currentUsername={currentUsername}
        />
      )}
      {showAddButton && (
        <EmojiPicker
          onEmojiSelect={onReact}
          trigger={
            <Button
              variant="ghost"
              size="icon" // Sicherstellen, dass der Button klein ist
              className="h-5 w-5 p-0 text-gray-500 hover:text-gray-300 hover:bg-gray-800/50 opacity-0 group-hover:opacity-100 transition-all duration-200"
            >
              <Plus className="h-3 w-3" />
            </Button>
          }
        />
      )}
    </div>
  );
};

export default MessageReactions;
