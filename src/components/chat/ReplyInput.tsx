import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, X } from 'lucide-react';

interface ReplyInputProps {
  onSend: (content: string) => void;
  onCancel: () => void;
  placeholder?: string;
}

export const ReplyInput: React.FC<ReplyInputProps> = ({ 
  onSend, 
  onCancel, 
  placeholder = "Antworten..." 
}) => {
  const [input, setInput] = useState('');

  const handleSend = () => {
    if (input.trim()) {
      onSend(input.trim());
      setInput('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
    if (e.key === 'Escape') {
      onCancel();
    }
  };

  return (
    <div className="ml-8 mt-2 flex items-center space-x-2 p-2 bg-muted/50 rounded-lg animate-scale-in">
      <Input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder={placeholder}
        onKeyDown={handleKeyPress}
        className="flex-1 h-8 text-sm"
        autoFocus
      />
      <Button 
        size="sm" 
        onClick={handleSend}
        disabled={!input.trim()}
        className="h-8 w-8 p-0"
      >
        <Send className="h-3 w-3" />
      </Button>
      <Button 
        variant="ghost" 
        size="sm" 
        onClick={onCancel}
        className="h-8 w-8 p-0"
      >
        <X className="h-3 w-3" />
      </Button>
    </div>
  );
};