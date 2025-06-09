
import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, MapPin, Clock, Euro, ExternalLink, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { PanelEventData } from './types';
import { useEventContext } from '@/contexts/EventContext';

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
  const { handleEventLike, eventLikes } = useEventContext();
  
  const currentEvent = panelData.events[currentIndex];
  
  // Use dummy image if no image_url is available
  const imageUrl = currentEvent.image_url && currentEvent.image_url !== 'keine' 
    ? currentEvent.image_url 
    : 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=400&h=300';
  
  // Get current likes count from EventContext or fallback to panel data
  const currentLikes = currentEvent.id.startsWith('github-')
    ? (eventLikes[currentEvent.id] || 0)
    : (currentEvent.likes || 0);
  
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
  
  const handleEventClick = () => {
    if (currentEvent.link) {
      // Open the external event link
      window.open(currentEvent.link, '_blank', 'noopener,noreferrer');
    } else if (onEventSelect) {
      // Fallback to internal event selection if no link available
      onEventSelect(currentEvent.id);
    }
  };

  const handleLike = (e: React.MouseEvent) => {
    e.stopPropagation();
    handleEventLike(currentEvent.id);
  };

  if (!currentEvent) return null;

  return (
    <div className={cn(
      "relative bg-gradient-to-br from-gray-900 to-black rounded-xl overflow-hidden shadow-2xl max-w-md mx-auto",
      className
    )}>
      {/* Event Image */}
      <div className="relative h-48 overflow-hidden">
        <img
          src={imageUrl}
          alt={currentEvent.title}
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
      
      {/* Event Content */}
      <div className="p-4 space-y-3">
        {/* Title */}
        <h3 className="text-lg font-semibold text-white line-clamp-2">
          {currentEvent.title}
        </h3>
        
        {/* Event Details */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-gray-300">
            <Clock className="h-4 w-4 text-red-400" />
            <span className="text-sm">{currentEvent.date} um {currentEvent.time}</span>
          </div>
          
          <div className="flex items-center gap-2 text-gray-300">
            <MapPin className="h-4 w-4 text-red-400" />
            <span className="text-sm line-clamp-1">{currentEvent.location}</span>
          </div>
          
          <div className="flex items-center gap-2 text-gray-300">
            <Euro className="h-4 w-4 text-green-400" />
            <span className="text-sm font-medium text-green-400">{currentEvent.price}</span>
          </div>

          {/* Likes Display */}
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 rounded-full transition-all hover:bg-red-500/20"
              onClick={handleLike}
            >
              <Heart className={cn(
                "h-4 w-4 transition-transform",
                currentLikes > 0 ? "fill-red-500 text-red-500" : "text-gray-400"
              )} />
            </Button>
            {currentLikes > 0 && (
              <span className="text-sm text-gray-300">{currentLikes}</span>
            )}
          </div>
        </div>
        
        {/* Action Button */}
        <Button
          onClick={handleEventClick}
          disabled={!currentEvent.link && !onEventSelect}
          className="w-full bg-red-500 hover:bg-red-600 text-white font-medium mt-4 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {currentEvent.link ? (
            <>
              <ExternalLink className="h-4 w-4 mr-2" />
              Zum Event
            </>
          ) : (
            "Event Details anzeigen"
          )}
        </Button>
      </div>
    </div>
  );
};

export default SwipeableEventPanel;
