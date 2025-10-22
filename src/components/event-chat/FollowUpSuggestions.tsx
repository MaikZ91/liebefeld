import React from 'react';
import { Button } from '@/components/ui/button';
import { Sparkles } from 'lucide-react';

interface FollowUpSuggestionsProps {
  suggestions: string[];
  onSelect: (suggestion: string) => void;
}

export const FollowUpSuggestions: React.FC<FollowUpSuggestionsProps> = ({
  suggestions,
  onSelect
}) => {
  if (!suggestions.length) return null;

  return (
    <div className="space-y-3 animate-fade-in">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Sparkles className="h-4 w-4 text-primary" />
        <span>Weitere Fragen:</span>
      </div>
      
      <div className="flex flex-wrap gap-2">
        {suggestions.map((suggestion, index) => (
          <Button
            key={index}
            variant="outline"
            size="sm"
            onClick={() => onSelect(suggestion)}
            className="border-white/20 hover:border-primary hover:bg-primary/10 transition-all duration-300"
          >
            {suggestion}
          </Button>
        ))}
      </div>
    </div>
  );
};
