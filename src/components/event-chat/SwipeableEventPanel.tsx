// src/components/event-chat/SwipeableEventPanel.tsx
import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, MapPin, Clock, Euro, UsersRound, Calendar, ExternalLink, Music } from 'lucide-react'; // Importiere zusätzliche Icons
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { PanelEventData, PanelEvent, AdEvent } from './types'; // Importiere AdEvent

interface SwipeableEventPanelProps {
  panelData: PanelEventData;
  onEventSelect?: (eventId: string) => void;
  className?: string;
}

const SwipeableEventPanel: React.FC<SwipeableEventPanelProps> = ({
  panelData,
  onEventSelect,
  className
}) => {
  const [currentIndex, setCurrentIndex] = useState(panelData.currentIndex || 0);
  
  const currentItem = panelData.events[currentIndex]; // currentItem kann nun Event oder Ad sein
  
  const handlePrevious = () => {
    setCurrentIndex((prev) => 
      prev === 0 ? panelData.events.length - 1 : prev - 1
    );
  };
  
  const handleNext = () => {
    setCurrentIndex((prev) => 
      prev === panelData.events.length - 1 ? 0 : prev + 1
    );
  };
  
  const handleClick = () => {
    if ('id' in currentItem && onEventSelect) { // Wenn es ein Event ist, wähle es aus
      onEventSelect(currentItem.id);
    } else if ('link' in currentItem && currentItem.link) { // Wenn es eine Anzeige mit Link ist, öffne den Link
      window.open(currentItem.link, '_blank', 'noopener,noreferrer');
    }
  };

  if (!currentItem) return null;

  // Bestimme, ob es sich um ein Event oder eine Anzeige handelt
  const isAd = !('id' in currentItem);
  const itemType = currentItem.type || (isAd ? 'Ad' : 'Event'); // Nutze den 'type' wenn vorhanden, sonst 'Ad' oder 'Event'

  return (
    <div className={cn(
      "relative bg-gradient-to-br from-gray-900 to-black rounded-xl overflow-hidden shadow-2xl max-w-md mx-auto",
      className
    )}>
      {/* Event/Ad Image */}
      <div className="relative h-48 overflow-hidden">
        <img
          src={currentItem.image_url || currentItem.imageUrl} // Nutze event.image_url oder ad.imageUrl
          alt={currentItem.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        
        {/* Navigation Arrows */}
        {panelData.events.length > 1 && (
          <>
            <Button
              variant="ghost"
              size="icon"
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/20 hover:bg-black/40 text-white rounded-full h-8 w-8"
              onClick={handlePrevious}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/20 hover:bg-black/40 text-white rounded-full h-8 w-8"
              onClick={handleNext}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </>
        )}
        
        {/* Event Index Indicator */}
        {panelData.events.length > 1 && (
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
            {panelData.events.map((_, index) => (
              <div
                key={index}
                className={cn(
                  "w-2 h-2 rounded-full transition-all",
                  index === currentIndex ? "bg-white" : "bg-white/40"
                )}
              />
            ))}
          </div>
        )}
      </div>
      
      {/* Event/Ad Content */}
      <div className="p-4 space-y-3">
        {/* Title */}
        <h3 className="text-lg font-semibold text-white line-clamp-2">
          {currentItem.title}
        </h3>
        
        {/* Details */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-gray-300">
            {isAd && itemType === 'music' ? (
              <Music className="h-4 w-4 text-purple-400" />
            ) : (
              <Calendar className="h-4 w-4 text-red-400" />
            )}
            <span className="text-sm">{currentItem.date} {isAd ? '' : `um ${currentItem.time}`}</span>
          </div>
          
          <div className="flex items-center gap-2 text-gray-300">
            {isAd && itemType === 'music' ? (
              <ExternalLink className="h-4 w-4 text-blue-400" />
            ) : isAd ? (
              <UsersRound className="h-4 w-4 text-purple-400" />
            ) : (
              <MapPin className="h-4 w-4 text-red-400" />
            )}
            <span className="text-sm line-clamp-1">{currentItem.location}</span>
          </div>
          
          {'price' in currentItem && (
            <div className="flex items-center gap-2 text-gray-300">
              <Euro className="h-4 w-4 text-green-400" />
              <span className="text-sm font-medium text-green-400">{currentItem.price}</span>
            </div>
          )}
        </div>
        
        {/* Action Button */}
        <Button
          onClick={handleClick}
          className={cn(
            "w-full font-medium mt-4",
            isAd && itemType === 'music' ? "bg-blue-500 hover:bg-blue-600 text-white" : "bg-red-500 hover:bg-red-600 text-white"
          )}
        >
          {isAd && itemType === 'music' ? 'Jetzt anhören' : isAd ? 'Community beitreten' : 'Event Details anzeigen'}
        </Button>
      </div>
    </div>
  );
};

export default SwipeableEventPanel;