
// src/components/event-chat/SwipeableEventPanel.tsx
import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, MapPin, Clock, Euro, UsersRound, Calendar, ExternalLink, Music, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { PanelEventData, PanelEvent, AdEvent } from './types';
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
  const { handleLikeEvent, eventLikes } = useEventContext();
  const [isLiking, setIsLiking] = useState(false);
  
  const currentItem = panelData.events[currentIndex];
  
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
    // Type guard to check if currentItem is an AdEvent
    if ('imageUrl' in currentItem && (currentItem as AdEvent).link) { // It's an AdEvent and has a link
      window.open((currentItem as AdEvent).link, '_blank', 'noopener,noreferrer');
    } else if ('id' in currentItem && onEventSelect) { // It's a PanelEvent and onEventSelect is provided
      onEventSelect(currentItem.id);
    }
  };

  const handleLike = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    // Only handle likes for PanelEvent items with an id
    if (!('id' in currentItem) || isLiking) return;
    
    const eventId = (currentItem as PanelEvent).id;
    setIsLiking(true);
    
    try {
      await handleLikeEvent(eventId);
    } catch (error) {
      console.error('Error liking event:', error);
    } finally {
      setTimeout(() => setIsLiking(false), 150);
    }
  };

  if (!currentItem) return null;

  // Determine if it's an AdEvent or PanelEvent
  const isAd = 'imageUrl' in currentItem;
  const isPanelEvent = 'id' in currentItem;
  
  // Safely get itemType and link
  const itemType = isAd ? (currentItem as AdEvent).type || 'ad' : (currentItem as PanelEvent).category;
  const imageUrl = isAd ? (currentItem as AdEvent).imageUrl : (currentItem as PanelEvent).image_url;
  const displayLink = isAd ? (currentItem as AdEvent).link : (currentItem as PanelEvent).link;

  // Get likes for PanelEvent items
  const eventLikesCount = isPanelEvent ? (eventLikes[(currentItem as PanelEvent).id] || 0) : 0;

  return (
    <div className={cn(
      "relative bg-gradient-to-br from-gray-900 to-black rounded-xl overflow-hidden shadow-2xl max-w-md mx-auto",
      className
    )}>
      {/* Event/Ad Image */}
      <div className="relative h-48 overflow-hidden">
        <img
          src={imageUrl}
          alt={currentItem.title}
          className="w-full h-full object-cover"
          onError={(e) => { // Fallback image if original fails to load
            e.currentTarget.src = 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=400&h=300&fit=crop';
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        
        {/* Sponsored Label */}
        {isAd && (
          <div className="absolute top-2 left-2 bg-yellow-500 text-black px-2 py-1 rounded-full text-xs font-semibold z-10">
            Sponsored
          </div>
        )}

        {/* Like Button for PanelEvent items */}
        {isPanelEvent && (
          <div className="absolute top-2 right-2 z-10">
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "h-10 w-10 rounded-full bg-black/20 hover:bg-black/40 backdrop-blur-sm transition-all",
                isLiking ? "opacity-70" : ""
              )}
              onClick={handleLike}
              disabled={isLiking}
            >
              <Heart className={cn(
                "h-5 w-5 transition-transform text-white",
                eventLikesCount > 0 ? "fill-red-500 text-red-500" : "",
                isLiking ? "scale-125" : ""
              )} />
            </Button>
            {eventLikesCount > 0 && (
              <div className="absolute -bottom-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
                {eventLikesCount}
              </div>
            )}
          </div>
        )}

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
            {itemType === 'music' ? (
              <Music className="h-4 w-4 text-purple-400" />
            ) : (
              <Calendar className="h-4 w-4 text-red-400" />
            )}
            <span className="text-sm">{currentItem.date} {('time' in currentItem && currentItem.time) ? `um ${currentItem.time}` : ''}</span>
          </div>
          
          <div className="flex items-center gap-2 text-gray-300">
            {itemType === 'music' || itemType === 'ad' || itemType === 'sponsored-ad' ? (
              <UsersRound className="h-4 w-4 text-purple-400" />
            ) : (
              <MapPin className="h-4 w-4 text-red-400" />
            )}
            <span className="text-sm line-clamp-1">{currentItem.location}</span>
          </div>
          
          {('price' in currentItem && currentItem.price) && ( // Safely access price property
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
            itemType === 'music' ? "bg-blue-500 hover:bg-blue-600 text-white" : "bg-red-500 hover:bg-red-600 text-white"
          )}
        >
          {itemType === 'music' ? (
            <>
              <Music className="w-4 h-4 mr-2" /> Jetzt anhören
            </>
          ) : isAd ? ( // Check if it's an Ad (includes sponsored-ad and event-type ads)
            <>
              <UsersRound className="w-4 h-4 mr-2" /> Community beitreten
            </>
          ) : (
            'Event Details anzeigen'
          )}
          {displayLink && <ExternalLink className="w-4 h-4 ml-2" />}
        </Button>
      </div>
    </div>
  );
};

export default SwipeableEventPanel;
