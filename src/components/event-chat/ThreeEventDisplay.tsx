import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Users, Heart, MessageSquare } from 'lucide-react';
import { PanelEventData, PanelEvent } from './types';
import { cn } from '@/lib/utils';
import EventLikeAvatars from './EventLikeAvatars';

interface ThreeEventDisplayProps {
  panelData: PanelEventData;
  onEventSelect?: (eventId: string) => void;
  onLikeEvent?: (eventId: string) => void;
  onJoinEventChat?: (eventId: string, eventTitle: string) => void;
  className?: string;
}

const ThreeEventDisplay: React.FC<ThreeEventDisplayProps> = ({
  panelData,
  onEventSelect,
  onLikeEvent,
  onJoinEventChat,
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
    <div className={cn("w-full space-y-6", className)}>

      {/* Three Event Cards with Swipe */}
      <div 
        ref={containerRef}
        className="overflow-hidden px-6"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
      >
        <div 
          className="flex gap-6 transition-transform duration-500 ease-out cursor-grab active:cursor-grabbing select-none"
          style={{
            transform: `translateX(${translateX}px)`,
            transition: isDragging ? 'none' : 'transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)'
          }}
        >
          {displayEvents.map((event, index) => {
            const imageUrl = 'image_url' in event ? event.image_url : '/placeholder-event.jpg';
            
            return (
              <div 
                key={`${currentIndex}-${index}`}
                className="group flex-shrink-0 w-1/3 bg-event-card/80 backdrop-blur-xl border border-event-border/50 rounded-3xl overflow-hidden cursor-pointer transition-all duration-500 hover:scale-[1.03] hover:shadow-xl hover:shadow-event-accent/20 hover:border-event-accent/30"
                onClick={() => handleEventClick(event as PanelEvent)}
                style={{
                  background: 'linear-gradient(135deg, hsl(var(--event-card)) 0%, hsl(var(--event-bg)) 100%)'
                }}
              >
                {/* Event Image */}
                <div className="relative h-52 overflow-hidden rounded-t-3xl">
                  <img
                    src={imageUrl}
                    alt={event.title}
                    className="w-full h-full object-cover pointer-events-none transition-transform duration-700 group-hover:scale-110"
                    onError={(e) => {
                      e.currentTarget.src = 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=400&h=300&fit=crop';
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
                  
                  {/* Premium Category Badge */}
                  {'category' in event && (
                    <div className="absolute top-3 left-3">
                      <div className="px-3 py-1 bg-glass-bg backdrop-blur-md border border-glass-border rounded-full text-xs font-medium text-white">
                        {event.category}
                      </div>
                    </div>
                  )}
                  
                  {/* Action Buttons */}
                  <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    {/* Like Button */}
                    {onLikeEvent && 'id' in event && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="bg-glass-bg hover:bg-glass-bg hover:scale-110 text-white rounded-full p-2.5 border border-glass-border backdrop-blur-md transition-all duration-300"
                        onClick={async (e) => {
                          e.stopPropagation();
                          await onLikeEvent(event.id);
                          setRefreshTrigger(prev => prev + 1);
                        }}
                      >
                        <Heart className="w-4 h-4 fill-current" />
                        <span className="ml-1 text-sm font-medium">{'likes' in event ? event.likes || 0 : 0}</span>
                      </Button>
                    )}

                    {/* Join Chat Button */}
                    {onJoinEventChat && 'id' in event && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="bg-primary/90 hover:bg-primary hover:scale-110 text-white text-xs px-3 py-2 h-auto rounded-full border border-primary/30 backdrop-blur-md transition-all duration-300 font-medium"
                        onClick={async (e) => {
                          e.stopPropagation();
                          await onJoinEventChat(event.id, event.title);
                        }}
                      >
                        <MessageSquare className="w-3.5 h-3.5 mr-1.5" />
                        Chat
                      </Button>
                    )}
                  </div>
                  
                  {/* Event Details */}
                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    <h3 className="text-white font-bold text-lg mb-2 line-clamp-2 leading-tight drop-shadow-lg">
                      {event.title}
                    </h3>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-white/90 text-sm">
                        {'time' in event && event.time && (
                          <span className="flex items-center gap-1 bg-black/30 px-2 py-1 rounded-full backdrop-blur-sm">
                            🕐 {event.time}
                          </span>
                        )}
                      </div>
                      
                      {/* Like Avatars */}
                      {'liked_by_users' in event && event.liked_by_users && (
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                          <EventLikeAvatars 
                            likedByUsers={event.liked_by_users} 
                            maxVisible={3}
                            size="xs"
                            className="ml-2"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Premium Swipe Indicators */}
      {totalEvents > 3 && (
        <div className="flex justify-center gap-2">
          {Array.from({ length: totalPages }).map((_, index) => (
            <div
              key={index}
              className={cn(
                "h-1.5 rounded-full transition-all duration-500",
                currentPage === index 
                  ? "w-8 bg-gradient-to-r from-event-accent to-primary shadow-lg shadow-event-accent/50" 
                  : "w-3 bg-muted/50 hover:bg-muted/70"
              )}
            />
          ))}
        </div>
      )}

    </div>
  );
};

export default ThreeEventDisplay;