import React, { useState } from 'react';
import { Heart, ChevronRight, X } from 'lucide-react';

interface InterestsDialogProps {
  open: boolean;
  onClose: () => void;
  onInterestsSelected: (interests: string[]) => void;
}

interface CategoryOption {
  id: string;
  label: string;
  emoji: string;
  mappedCategories: string[];
}

const CATEGORIES: CategoryOption[] = [
  { 
    id: 'ausgehen', 
    label: 'Ausgehen', 
    emoji: '🎉',
    mappedCategories: ['Ausgehen', 'Bar', 'Club', 'Nightlife', 'Party', 'Sonstiges']
  },
  { 
    id: 'kreativitaet', 
    label: 'Kreativität', 
    emoji: '🎨',
    mappedCategories: ['Kreativität', 'Kunst', 'Art', 'Workshop', 'Kultur', 'Konzert', 'Musik']
  },
  { 
    id: 'sport', 
    label: 'Sport', 
    emoji: '⚽',
    mappedCategories: ['Sport', 'Hochschulsport', 'Fitness', 'Outdoor', 'Laufen', 'Yoga']
  },
];

export const InterestsDialog: React.FC<InterestsDialogProps> = ({ open, onClose, onInterestsSelected }) => {
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const toggleSelect = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleContinue = () => {
    const selectedCategories = Array.from(selected);
    if (selectedCategories.length > 0) {
      localStorage.setItem('tribe_preferred_categories', JSON.stringify(selectedCategories));
      onInterestsSelected(selectedCategories);
    }
    localStorage.setItem('tribe_seen_interests_dialog', 'true');
    onClose();
  };

  const handleSkip = () => {
    localStorage.setItem('tribe_seen_interests_dialog', 'true');
    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[60] animate-slide-up max-w-2xl mx-auto">
      <div className="bg-zinc-900 border-t border-gold/30 rounded-t-2xl p-5 shadow-2xl shadow-gold/10">
        {/* Close button */}
        <button 
          onClick={handleSkip}
          className="absolute top-3 right-3 text-zinc-500 hover:text-white transition-colors"
        >
          <X size={20} />
        </button>

        {/* Minimal greeting */}
        <p className="text-zinc-300 text-sm text-center mb-4">
          Was interessiert dich? So findest du passende Events!
        </p>

        {/* Category chips */}
        <div className="flex justify-center gap-2 mb-5 flex-wrap">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => toggleSelect(cat.id)}
              className={`
                flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium
                transition-all duration-200 active:scale-95
                ${selected.has(cat.id)
                  ? 'bg-gold text-black shadow-md'
                  : 'bg-zinc-800 text-zinc-300 border border-zinc-700 hover:border-gold/50'
                }
              `}
            >
              <span>{cat.emoji}</span>
              <span>{cat.label}</span>
              {selected.has(cat.id) && (
                <Heart className="w-3.5 h-3.5 fill-current" />
              )}
            </button>
          ))}
        </div>

        {/* Continue button */}
        <button
          onClick={handleContinue}
          disabled={selected.size === 0}
          className={`
            w-full py-3 rounded-xl font-medium text-sm flex items-center justify-center gap-2
            transition-all duration-200 active:scale-98
            ${selected.size > 0
              ? 'bg-gold text-black hover:bg-gold/90'
              : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
            }
          `}
        >
          {selected.size > 0 ? (
            <>
              Los geht's
              <ChevronRight className="w-4 h-4" />
            </>
          ) : (
            'Wähle mindestens 1'
          )}
        </button>
      </div>
    </div>
  );
};

export default InterestsDialog;
