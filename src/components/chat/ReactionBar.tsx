
import React from 'react';
import { Button } from '@/components/ui/button';

interface ReactionBarProps {
  reactions: { emoji: string; users: string[] }[];
  onReact: (emoji: string) => void;
  currentUsername: string;
}

const ReactionBar: React.FC<ReactionBarProps> = ({
  reactions,
  onReact,
  currentUsername
}) => {
  if (!reactions || reactions.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-0.5">
      {reactions.map((reaction, index) => {
        const hasUserReacted = reaction.users.includes(currentUsername);
        const count = reaction.users.length;
        
        return (
          <Button
            key={index}
            variant="ghost"
            size="sm"
            onClick={() => onReact(reaction.emoji)}
            className={`h-6 px-1.5 py-0.5 rounded-full text-xs font-medium transition-all duration-200 ${
              hasUserReacted
                ? 'bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30'
                : 'bg-gray-800/50 text-gray-300 border border-gray-700/50 hover:bg-gray-700/70'
            }`}
          >
            <span className="mr-0.5">{reaction.emoji}</span>
            <span className="text-xs">{count}</span>
          </Button>
        );
      })}
    </div>
  );
};

export default ReactionBar;
