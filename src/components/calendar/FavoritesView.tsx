
import React from 'react';
import { Heart, List } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Event } from '@/types/eventTypes';

interface FavoritesViewProps {
  favoriteEvents: Event[];
  onSwitchToList: () => void;
}

const FavoritesView: React.FC<FavoritesViewProps> = ({ favoriteEvents, onSwitchToList }) => {
  return (
    <div className="flex flex-col items-center justify-center h-[300px] text-gray-400">
      <Heart className="w-12 h-12 mb-4 text-red-500" />
      <h3 className="text-xl font-medium text-white mb-2">Deine Favoriten</h3>
      <p className="text-center mb-4">
        {favoriteEvents.length 
          ? `Du hast ${favoriteEvents.length} Favoriten` 
          : "Du hast noch keine Favoriten"}
      </p>
      {favoriteEvents.length > 0 && (
        <Button
          variant="outline"
          onClick={onSwitchToList}
          className="text-white border-white hover:bg-white/10"
        >
          <List className="w-4 h-4 mr-2" />
          Als Liste anzeigen
        </Button>
      )}
    </div>
  );
};

export default FavoritesView;
