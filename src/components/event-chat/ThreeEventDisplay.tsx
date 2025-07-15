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
  onSwipeDownToHide?: () => void; // New prop for swipe down gesture
  onSwipeUpToShow?: () => void;   // New prop for swipe up gesture
}

const ThreeEventDisplay: React.FC<ThreeEventDisplayProps> = ({
  panelData,
  onEventSelect,
  onLikeEvent,
  onJoinEventChat,
  className,
  onSwipeDownToHide, // Destructure new prop
  onSwipeUpToShow    // Destructure new prop
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [translateX, setTranslateX] = useState(0);
  const [initialClientY, setInitialClientY] = useState(0); // New state for vertical swipe
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

  // New state for vertical dragging
  const [isVerticalDragging, setIsVerticalDragging] = useState(false);

  // Touch handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    // If horizontal event count is too low, disable horizontal dragging
    if (totalEvents <= eventsPerPage) {
      setIsDragging(false);
    } else {
      setIsDragging(true);
    }
    
    setStartX(e.touches[0].clientX);
    setTranslateX(0);
    setInitialClientY(e.touches[0].clientY); // Capture initial Y for vertical swipe
    setIsVerticalDragging(false); // Reset vertical dragging state
    console.log('Touch Start: initialY =', initialClientY);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    const currentX = e.touches[0].clientX;
    const currentY = e.touches[0].clientY;
    const diffX = currentX - startX;
    const diffY = currentY - initialClientY;

    // If a swipe direction isn't confirmed yet
    if (!isDragging && !isVerticalDragging) {
      if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 10) {
        setIsDragging(true); // Confirm horizontal
        console.log('Confirmed horizontal drag');
      } else if (Math.abs(diffY) > Math.abs(diffX) && Math.abs(diffY) > 10) {
        setIsVerticalDragging(true); // Confirm vertical
        e.preventDefault(); // Prevent page scroll only if truly vertical drag
        console.log('Confirmed vertical drag, preventing default');
      } else {
        return; // Not enough movement to determine yet
      }
    }

    if (isDragging) { // Handle horizontal drag
      setTranslateX(diffX);
    } else if (isVerticalDragging) {
      // Prevent default to avoid scrolling background while vertically dragging the panel itself
      e.preventDefault(); 
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const horizontalSwipeThreshold = 80;
    const verticalSwipeThreshold = 50; // pixels

    if (isDragging) { // Horizontal swipe completed
      if (Math.abs(translateX) > horizontalSwipeThreshold) {
        if (translateX > 0 && currentPage > 0) {
          setCurrentIndex((currentPage - 1) * eventsPerPage);
        } else if (translateX < 0 && currentPage < totalPages - 1) {
          setCurrentIndex((currentPage + 1) * eventsPerPage);
        }
      }
    } else if (isVerticalDragging) { // Vertical swipe completed
      const finalY = e.changedTouches[0].clientY; // Use changedTouches for end
      const swipeDistanceY = finalY - initialClientY;

      if (swipeDistanceY > verticalSwipeThreshold) { // Swiped down
        onSwipeDownToHide?.();
        console.log('Swiped down, calling onSwipeDownToHide');
      } else if (swipeDistanceY < -verticalSwipeThreshold) { // Swiped up
        onSwipeUpToShow?.();
        console.log('Swiped up, calling onSwipeUpToShow');
      }
    }
    
    // Reset all dragging states
    setIsDragging(false);
    setIsVerticalDragging(false);
    setTranslateX(0);
    console.log('Touch End: Drag states reset');
  };

  // Mouse handlers for desktop
  const handleMouseDown = (e: React.MouseEvent) => {
    if (totalEvents <= eventsPerPage) {
      setIsDragging(false);
    } else {
      setIsDragging(true);
    }
    setStartX(e.clientX);
    setTranslateX(0);
    setInitialClientY(e.clientY); // Capture initial Y for vertical swipe
    setIsVerticalDragging(false); // Reset vertical dragging state
    console.log('Mouse Down: initialY =', initialClientY);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    const currentX = e.clientX;
    const currentY = e.clientY;
    const diffX = currentX - startX;
    const diffY = currentY - initialClientY;

    if (!isDragging && !isVerticalDragging) {
      if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 10) {
        setIsDragging(true); // Confirm horizontal
        console.log('Confirmed horizontal drag (mouse)');
      } else if (Math.abs(diffY) > Math.abs(diffX) && Math.abs(diffY) > 10) {
        setIsVerticalDragging(true); // Confirm vertical
        e.preventDefault(); // Prevent text selection
        console.log('Confirmed vertical drag (mouse), preventing default');
      } else {
        return;
      }
    }

    if (isDragging) {
      setTranslateX(diffX);
    } else if (isVerticalDragging) {
      e.preventDefault(); // Prevent text selection while dragging vertically
    }
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    const horizontalSwipeThreshold = 80;
    const verticalSwipeThreshold = 50; // pixels

    if (isDragging) { // Horizontal swipe completed
      if (Math.abs(translateX) > horizontalSwipeThreshold) {
        if (translateX > 0 && currentPage > 0) {
          setCurrentIndex((currentPage - 1) * eventsPerPage);
        } else if (translateX < 0 && currentPage < totalPages - 1) {
          setCurrentIndex((currentPage + 1) * eventsPerPage);
        }
      }
    } else if (isVerticalDragging) { // Vertical swipe completed
      const finalY = e.clientY;
      const swipeDistanceY = finalY - initialClientY;

      if (swipeDistanceY > verticalSwipeThreshold) { // Swiped down
        onSwipeDownToHide?.();
        console.log('Swiped down (mouse), calling onSwipeDownToHide');
      } else if (swipeDistanceY < -verticalSwipeThreshold) { // Swiped up
        onSwipeUpToShow?.();
        console.log('Swiped up (mouse), calling onSwipeUpToShow');
      }
    }
    
    // Reset all dragging states
    setIsDragging(false);
    setIsVerticalDragging(false);
    setTranslateX(0);
    console.log('Mouse Up: Drag states reset');
  };

  // Add global mouse event listeners
  React.useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => {
      // This listener is primarily for when the mouse is dragged outside the component before release.
      // It only needs to track if dragging is ongoing, not trigger page changes directly.
      if (isDragging && containerRef.current && !containerRef.current.contains(e.target as Node)) {
        const diffX = e.clientX - startX;
        setTranslateX(diffX);
      }
      // If vertical dragging started within this component and mouse moves globally,
      // it should ideally still be tracked by the local component's mousemove, but its end should be handled.
      // For simplicity, we assume mouseup will happen on the element or globally.
    };

    const handleGlobalMouseUp = () => {
      // This handles the case where the mouse button is released outside the component
      // after a drag started inside it.
      if (isDragging) {
        setIsDragging(false);
        setTranslateX(0); // Snap back if not released over the component
        console.log('Global Mouse Up: Horizontal drag reset');
      }
      if (isVerticalDragging) {
        setIsVerticalDragging(false);
        console.log('Global Mouse Up: Vertical drag reset');
      }
    };


    if (isDragging || isVerticalDragging) {
      document.addEventListener('mousemove', handleGlobalMouseMove);
      document.addEventListener('mouseup', handleGlobalMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleGlobalMouseMove);
      document.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [isDragging, isVerticalDragging, startX, translateX, totalEvents]);
  

  if (displayEvents.length === 0) return null;

  return (
    <div className={cn("w-full space-y-4", className)}>

      {/* Three Event Cards with Swipe */}
      <div 
        ref={containerRef}
        className="overflow-hidden px-1"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
      >
        <div 
          className="flex gap-1 transition-transform duration-300 ease-out cursor-grab active:cursor-grabbing select-none"
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
                  
                  {/* Action Buttons */}
                  <div className="absolute top-2 right-2 flex gap-1">
                    {/* Join Chat Button */}
                    {onJoinEventChat && 'id' in event && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="bg-red-800/50 hover:bg-red-700/60 text-white text-xs px-2 py-1 h-auto rounded"
                        onClick={async (e) => {
                          e.stopPropagation();
                          await onJoinEventChat(event.id, event.title);
                        }}
                      >
                        <MessageSquare className="w-3 h-3 mr-1" />
                        Chat
                      </Button>
                    )}
                    
                    {/* Like Button */}
                    {onLikeEvent && 'id' in event && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="bg-black/50 hover:bg-black/70 text-white rounded-full p-2"
                        onClick={async (e) => {
                          e.stopPropagation();
                          // No 'isLiking' state here, using EventHeatmap's handleLikeEvent
                          await onLikeEvent(event.id);
                          // Trigger refresh of avatars after like
                          setRefreshTrigger(prev => prev + 1);
                        }}
                      >
                        <Heart className="w-4 h-4" />
                        <span className="ml-1 text-sm">{'likes' in event ? event.likes || 0 : 0}</span>
                      </Button>
                    )}
                  </div>
                  
                  {/* Event Details mit Like Avatars */}
                  <div className="absolute bottom-0 left-0 right-0 p-3">
                    <h3 className="text-white font-bold text-sm mb-1 line-clamp-4 leading-tight">
                      {event.title}
                    </h3>
                    
                    <div className="flex items-center justify-between">
                      <div className="text-gray-300 text-xs">
                        {'time' in event && event.time && event.time}
                      </div>
                      
                      {/* Like Avatars */}
                      {'liked_by_users' in event && event.liked_by_users && (
                        <div>
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