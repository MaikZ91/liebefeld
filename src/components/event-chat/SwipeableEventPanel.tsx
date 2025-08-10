
// src/components/event-chat/SwipeableEventPanel.tsx
import React, { useState, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight, MapPin, Clock, Euro, UsersRound, Calendar, ExternalLink, Music, Heart, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { PanelEventData, PanelEvent, AdEvent } from './types';
import { useEventContext } from '@/contexts/EventContext';

interface SwipeableEventPanelProps {
  panelData: PanelEventData;
  onEventSelect?: (eventId: string) => void;
  onJoinEventChat?: (eventId: string, eventTitle: string) => void;
  className?: string;
}

const SwipeableEventPanel: React.FC<SwipeableEventPanelProps> = ({
  panelData,
  onEventSelect,
  onJoinEventChat,
  className
}) => {
  const { handleLikeEvent, events } = useEventContext();
  const [currentIndex, setCurrentIndex] = useState(panelData.currentIndex || 0);
  const [isLiking, setIsLiking] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [translateX, setTranslateX] = useState(0);
  const panelRef = useRef<HTMLDivElement>(null);

  // Sort events by likes in descending order
  const sortedEvents = React.useMemo(() => {
    const combinedItems = [...panelData.events];
    combinedItems.sort((a, b) => {
      const likesA = ('likes' in a && a.likes !== undefined) ? a.likes : 0;
      const likesB = ('likes' in b && b.likes !== undefined) ? b.likes : 0;
      return likesB - likesA;
    });
    return combinedItems;
  }, [panelData.events]);

  const currentPanelItem = sortedEvents[currentIndex];
  const currentItem = ('id' in currentPanelItem && currentPanelItem.id)
    ? events.find(e => e.id === currentPanelItem.id) || currentPanelItem
    : currentPanelItem;

  const handlePrevious = () => {
    setCurrentIndex((prev) =>
      prev === 0 ? sortedEvents.length - 1 : prev - 1
    );
  };

  const handleNext = () => {
    setCurrentIndex((prev) =>
      (prev + 1) % sortedEvents.length
    );
  };

  // Touch event handlers for swipe functionality
  const handleTouchStart = (e: React.TouchEvent) => {
    if (sortedEvents.length <= 1) return;
    setIsDragging(true);
    setStartX(e.touches[0].clientX);
    setTranslateX(0);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || sortedEvents.length <= 1) return;
    const currentX = e.touches[0].clientX;
    const diffX = currentX - startX;
    setTranslateX(diffX);
  };

  const handleTouchEnd = () => {
    if (!isDragging || sortedEvents.length <= 1) return;
    setIsDragging(false);
    
    const threshold = 100; // Minimum swipe distance
    
    if (Math.abs(translateX) > threshold) {
      if (translateX > 0) {
        handlePrevious();
      } else {
        handleNext();
      }
    }
    
    setTranslateX(0);
  };

  // Mouse event handlers for desktop swipe support
  const handleMouseDown = (e: React.MouseEvent) => {
    if (sortedEvents.length <= 1) return;
    setIsDragging(true);
    setStartX(e.clientX);
    setTranslateX(0);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || sortedEvents.length <= 1) return;
    const diffX = e.clientX - startX;
    setTranslateX(diffX);
  };

  const handleMouseUp = () => {
    if (!isDragging || sortedEvents.length <= 1) return;
    setIsDragging(false);
    
    const threshold = 100;
    
    if (Math.abs(translateX) > threshold) {
      if (translateX > 0) {
        handlePrevious();
      } else {
        handleNext();
      }
    }
    
    setTranslateX(0);
  };

  // Add global mouse event listeners
  useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (!isDragging || sortedEvents.length <= 1) return;
      const diffX = e.clientX - startX;
      setTranslateX(diffX);
    };

    const handleGlobalMouseUp = () => {
      if (!isDragging || sortedEvents.length <= 1) return;
      setIsDragging(false);
      
      const threshold = 100;
      
      if (Math.abs(translateX) > threshold) {
        if (translateX > 0) {
          handlePrevious();
        } else {
          handleNext();
        }
      }
      
      setTranslateX(0);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleGlobalMouseMove);
      document.addEventListener('mouseup', handleGlobalMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleGlobalMouseMove);
      document.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [isDragging, startX, translateX, sortedEvents.length]);

  const handleClick = () => {
    if (Math.abs(translateX) > 10) return; // Prevent click if swiping
    
    if ('imageUrl' in currentItem && (currentItem as AdEvent).link) {
      window.open((currentItem as AdEvent).link, '_blank', 'noopener,noreferrer');
    } else if ('id' in currentItem && onEventSelect) {
      onEventSelect(currentItem.id);
    }
  };

  const handleLike = async (e: React.MouseEvent) => {
    e.stopPropagation();

    if (!('id' in currentItem) || isLiking) return;

    const eventId = (currentItem as PanelEvent).id;
    setIsLiking(true);

    await handleLikeEvent(eventId);

    setTimeout(() => setIsLiking(false), 250);
  };

  if (!currentItem) return null;

  const isAd = 'imageUrl' in currentItem;
  const isPanelEvent = 'id' in currentItem;
  const itemType = isAd ? (currentItem as AdEvent).type || 'ad' : (currentItem as PanelEvent).category;
  const imageUrl = isAd ? (currentItem as AdEvent).imageUrl : (currentItem as PanelEvent).image_url;
  const displayLink = isAd ? (currentItem as AdEvent).link : (currentItem as PanelEvent).link;
  const eventLikesCount = isPanelEvent ? ((currentItem as PanelEvent).likes || 0) : 0;

  return (
    <div className={cn(
      "relative rounded-xl overflow-visible max-w-md mx-auto select-none",
      className
    )}>
      {/* Swipeable Card Container */}
      <div
        ref={panelRef}
        className="transition-transform duration-300 ease-out cursor-grab active:cursor-grabbing"
        style={{
          transform: `translateX(${translateX}px)`,
          transition: isDragging ? 'none' : 'transform 0.3s ease-out'
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
      >
        {/* Event/Ad Image */}
        <div className="relative h-48 overflow-hidden">
          <img
            src={imageUrl}
            alt={currentItem.title}
            className="w-full h-full object-cover pointer-events-none"
            onError={(e) => {
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
          {sortedEvents.length > 1 && (
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
          {sortedEvents.length > 1 && (
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
              {sortedEvents.map((_, index) => (
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

          {/* Swipe Indicators */}
          {sortedEvents.length > 1 && isDragging && (
            <>
              <div className={cn(
                "absolute left-4 top-1/2 -translate-y-1/2 transition-opacity",
                translateX > 50 ? "opacity-100" : "opacity-30"
              )}>
                <div className="bg-green-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
                  Zurück
                </div>
              </div>
              <div className={cn(
                "absolute right-4 top-1/2 -translate-y-1/2 transition-opacity",
                translateX < -50 ? "opacity-100" : "opacity-30"
              )}>
                <div className="bg-blue-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
                  Weiter
                </div>
              </div>
            </>
          )}
        </div>

        {/* Event/Ad Content */}
        <div className="mx-3 mt-2 mb-3 rounded-2xl bg-black/75 p-4 space-y-3 backdrop-blur-sm border border-white/10">
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
              {itemType === 'music' ? (
                <ExternalLink className="h-4 w-4 text-purple-400" />
              ) : (
                <MapPin className="h-4 w-4 text-red-400" />
              )}
              <span className="text-sm line-clamp-1">{currentItem.location}</span>
            </div>

            {('price' in currentItem && currentItem.price) && (
              <div className="flex items-center gap-2 text-gray-300">
                <Euro className="h-4 w-4 text-green-400" />
                <span className="text-sm font-medium text-green-400">{currentItem.price}</span>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 mt-4">
            {/* Join Chat Button for Events (not ads) */}
            {isPanelEvent && onJoinEventChat && (
              <Button
                onClick={(e) => {
                  e.stopPropagation();
                  onJoinEventChat((currentItem as PanelEvent).id, currentItem.title);
                }}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white font-medium"
              >
                <MessageSquare className="w-4 h-4 mr-2" />
                Join Chat
              </Button>
            )}
            
            {/* Main Action Button */}
            <Button
              onClick={handleClick}
              className={cn(
                "font-medium",
                isPanelEvent && onJoinEventChat ? "flex-1" : "w-full",
                itemType === 'music' ? "bg-blue-500 hover:bg-blue-600 text-white" : "bg-gray-700 hover:bg-gray-600 text-white"
              )}
            >
              {itemType === 'music' ? (
                <>
                  <Music className="w-4 h-4 mr-2" /> Anhören
                </>
              ) : isAd ? (
                <>
                  <UsersRound className="w-4 h-4 mr-2" /> Beitreten
                </>
              ) : (
                'Details'
              )}
              {displayLink && <ExternalLink className="w-4 h-4 ml-2" />}
            </Button>
          </div>
        </div>
      </div>

      {/* Swipe Instructions */}
      {sortedEvents.length > 1 && !isDragging && (
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-xs text-gray-400 opacity-70">
          ← Wischen zum Navigieren →
        </div>
      )}
    </div>
  );
};

export default SwipeableEventPanel;
