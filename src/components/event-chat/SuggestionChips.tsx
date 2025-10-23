import React from 'react';
import { Button } from '@/components/ui/button';
import { MessageCircle, MapPin, Info, Sparkles } from 'lucide-react';

interface SuggestionChipsProps {
  suggestions: string[];
  onSuggestionClick: (suggestion: string) => void;
}

const SuggestionChips: React.FC<SuggestionChipsProps> = ({ suggestions, onSuggestionClick }) => {
  const getIcon = (suggestion: string) => {
    const lower = suggestion.toLowerCase();
    if (lower.includes('karte') || lower.includes('map')) return <MapPin className="w-3 h-3" />;
    if (lower.includes('info') || lower.includes('details') || lower.includes('mehr')) return <Info className="w-3 h-3" />;
    if (lower.includes('weitere') || lower.includes('mehr events')) return <Sparkles className="w-3 h-3" />;
    return <MessageCircle className="w-3 h-3" />;
  };

  return (
    <div className="flex flex-wrap gap-2 mt-3 px-4">
      {suggestions.map((suggestion, index) => (
        <Button
          key={index}
          variant="outline"
          size="sm"
          onClick={() => onSuggestionClick(suggestion)}
          className="h-8 text-xs font-medium rounded-full bg-white/5 hover:bg-white/10 border-white/20 text-white/80 hover:text-white transition-all duration-200 hover:scale-105 hover:shadow-lg hover:shadow-red-500/20 flex items-center gap-1.5"
        >
          {getIcon(suggestion)}
          <span>{suggestion}</span>
        </Button>
      ))}
    </div>
  );
};

export default SuggestionChips;
