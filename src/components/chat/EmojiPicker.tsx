
import React from 'react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Smile } from 'lucide-react';

interface EmojiPickerProps {
  onEmojiSelect: (emoji: string) => void;
  trigger?: React.ReactNode;
}

const quickReactions = [
  { emoji: '👍', label: 'Daumen hoch' },
  { emoji: '❤️', label: 'Herz' },
  { emoji: '😂', label: 'Lachen' },
  { emoji: '😮', label: 'Wow' },
  { emoji: '😢', label: 'Traurig' },
  { emoji: '😡', label: 'Wütend' },
  { emoji: '🔥', label: 'Feuer' },
  { emoji: '👏', label: 'Klatschen' },
  { emoji: '🎉', label: 'Feiern' },
  { emoji: '💯', label: 'Hundert' },
];

const EmojiPicker: React.FC<EmojiPickerProps> = ({ onEmojiSelect, trigger }) => {
  return (
    <Popover>
      <PopoverTrigger asChild>
        {trigger || (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground hover:bg-accent"
          >
            <Smile className="h-4 w-4" />
          </Button>
        )}
      </PopoverTrigger>
      <PopoverContent
        className="w-80 p-3 bg-popover border-border"
        side="top"
        align="start"
      >
        <div className="grid grid-cols-5 gap-2">
          {quickReactions.map((reaction) => (
            <Button
              key={reaction.emoji}
              variant="ghost"
              className="h-10 w-10 p-0 text-lg hover:bg-accent transition-colors"
              onClick={() => onEmojiSelect(reaction.emoji)}
              title={reaction.label}
            >
              {reaction.emoji}
            </Button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default EmojiPicker;
