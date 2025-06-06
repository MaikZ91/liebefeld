
import React from 'react';
import { Smile, ThumbsUp, Heart, Laugh, Angry } from 'lucide-react';

interface MessageReactionsProps {
  reactions: { emoji: string; users: string[] }[];
  onReact: (emoji: string) => void;
  currentUsername: string;
}

const MessageReactions: React.FC<MessageReactionsProps> = ({
  reactions,
  onReact,
  currentUsername
}) => {
  if (!reactions || reactions.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1 mt-1">
      {reactions.map((reaction, index) => {
        const hasUserReacted = reaction.users.includes(currentUsername);
        return (
          <button
            key={index}
            onClick={() => onReact(reaction.emoji)}
            className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs border transition-colors ${
              hasUserReacted
                ? 'bg-red-500/20 border-red-500 text-red-400'
                : 'bg-gray-800 border-gray-600 text-gray-300 hover:bg-gray-700'
            }`}
          >
            <span>{reaction.emoji}</span>
            <span>{reaction.users.length}</span>
          </button>
        );
      })}
    </div>
  );
};

export default MessageReactions;
