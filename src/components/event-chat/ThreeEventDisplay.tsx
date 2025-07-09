import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Users, Heart } from 'lucide-react';
import { PanelEventData, PanelEvent } from './types';
import { cn } from '@/lib/utils';
import EventLikeAvatars from './EventLikeAvatars';

interface ThreeEventDisplayProps {
  panelData: PanelEventData;
  onEventSelect?: (eventId: string) => void;
  onLikeEvent?: (eventId: string) => void;
  className?: string;
}

const ThreeEventDisplay: React.FC<ThreeEventDisplayProps> = ({
  panelData,
  onEventSelect,
  onLikeEvent,
  className
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [translateX, setTranslateX] = useState(0);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  
  const containerRef = useRef<HTMLDivElement>(null);

  const totalEvents = panelData.events.length;
  const eventsPerPage = 3;
  const totalPages = Math.ceil(totalEvents / eventsPerPage);

  // Get current 3 events to display based on page
  const currentPage = Math.floor(currentIndex / eventsPerPage);
  const startIndex = currentPage * eventsPerPage;
  const displayEvents = panelData.events.slice(startIndex, startIndex + eventsPerPage);

  const handleEventClick = (event: PanelEvent) => {
    if (Math.abs(translateX) > 10) return; // Prevent click during swipe
    if ('id' in event && onEventSelect) {
      onEventSelect(event.id);
    }
  };

  // Touch handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    if (totalEvents <= 3) return;
    setIsDragging(true);
    setStartX(e.touches[0].clientX);
    setTranslateX(0);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || totalEvents <= 3) return;
    const currentX = e.touches[0].clientX;
    const diffX = currentX - startX;
    setTranslateX(diffX);
  };

  const handleTouchEnd = () => {
    if (!isDragging || totalEvents <= 3) return;
    setIsDragging(false);
    
    const threshold = 80;
    
    if (Math.abs(translateX) > threshold) {
      if (translateX > 0 && currentPage > 0) {
        // Go to previous page (previous 3 events)
        setCurrentIndex((currentPage - 1) * eventsPerPage);
      } else if (translateX < 0 && currentPage < totalPages - 1) {
        // Go to next page (next 3 events)
        setCurrentIndex((currentPage + 1) * eventsPerPage);
      }
    }
    
    setTranslateX(0);
  };

  // Mouse handlers for desktop
  const handleMouseDown = (e: React.MouseEvent) => {
    if (totalEvents <= 3) return;
    setIsDragging(true);
    setStartX(e.clientX);
    setTranslateX(0);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || totalEvents <= 3) return;
    const diffX = e.clientX - startX;
    setTranslateX(diffX);
  };

  const handleMouseUp = () => {
    if (!isDragging || totalEvents <= 3) return;
    setIsDragging(false);
    
    const threshold = 80;
    
    if (Math.abs(translateX) > threshold) {
      if (translateX > 0 && currentPage > 0) {
        // Go to previous page (previous 3 events)
        setCurrentIndex((currentPage - 1) * eventsPerPage);
      } else if (translateX < 0 && currentPage < totalPages - 1) {
        // Go to next page (next 3 events)
        setCurrentIndex((currentPage + 1) * eventsPerPage);
      }
    }
    
    setTranslateX(0);
  };

  if (displayEvents.length === 0) return null;

  return (
    <div className={cn("w-full space-y-4", className)}>

      {/* Three Event Cards with Swipe */}
      <div 
        ref={containerRef}
        className="overflow-hidden px-4"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
      >
        <div 
          className="flex gap-4 transition-transform duration-300 ease-out cursor-grab active:cursor-grabbing select-none"
          style={{
            transform: `translateX(${translateX}px)`,
            transition: isDragging ? 'none' : 'transform 0.3s ease-out'
          }}
        >
          {displayEvents.map((event, index) => {
            const imageUrl = 'image_url' in event ? event.image_url : '/placeholder-event.jpg';
            
            return (
              <div 
                key={`${currentIndex}-${index}`}
                className="flex-shrink-0 w-1/3 bg-black rounded-2xl overflow-hidden cursor-pointer transform transition-transform hover:scale-105"
                onClick={() => handleEventClick(event as PanelEvent)}
              >
                {/* Event Image */}
                <div className="relative h-48 overflow-hidden">
                  <img
                    src={imageUrl}
                    alt={event.title}
                    className="w-full h-full object-cover pointer-events-none"
                    onError={(e) => {
                      e.currentTarget.src = 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=400&h=300&fit=crop';
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                  
                  {/* Like Button */}
                  {onLikeEvent && 'id' in event && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="absolute top-2 right-2 bg-black/50 hover:bg-black/70 text-white rounded-full p-2"
                      onClick={async (e) => {
                        e.stopPropagation();
                        await onLikeEvent(event.id);
                        // Trigger refresh of avatars after like
                        setRefreshTrigger(prev => prev + 1);
                      }}
                    >
                      <Heart className="w-4 h-4" />
                      <span className="ml-1 text-sm">{'likes' in event ? event.likes || 0 : 0}</span>
                    </Button>
                  )}
                  
                  {/* Event Details mit Like Avatars */}
                  <div className="absolute bottom-0 left-0 right-0 p-3">
                    <h3 className="text-white font-bold text-base mb-1 line-clamp-4 leading-tight">
                      {event.title}
                    </h3>
                    
                    <div className="flex items-center justify-between">
                      <div className="text-gray-300 text-xs">
                        {'time' in event && event.time && event.time}
                      </div>
                      
                      {/* Like Avatars */}
                      {'id' in event && (
                        <EventLikeAvatars 
                          eventId={event.id} 
                          maxVisible={3}
                          size="xs"
                          className="ml-2"
                          refreshTrigger={refreshTrigger}
                        />
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Swipe Indicators */}
      {totalEvents > 3 && (
        <div className="flex justify-center gap-2">
          {Array.from({ length: totalPages }).map((_, index) => (
            <div
              key={index}
              className={cn(
                "w-2 h-2 rounded-full transition-all",
                currentPage === index ? "bg-white" : "bg-white/40"
              )}
            />
          ))}
        </div>
      )}

    </div>
  );
};

export default ThreeEventDisplay;