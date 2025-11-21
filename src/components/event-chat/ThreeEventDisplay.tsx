import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Users, Heart, ChevronDown, X } from 'lucide-react';
import { PanelEventData, PanelEvent } from './types';
import { cn } from '@/lib/utils';
import EventLikeAvatars from './EventLikeAvatars';

interface ThreeEventDisplayProps {
  panelData: PanelEventData;
  onEventSelect?: (eventId: string) => void;
  onLikeEvent?: (eventId: string) => void;
  onDislikeEvent?: (eventId: string) => void;
  className?: string;
  onSwipeDownToHide?: () => void; // New prop for swipe down gesture
  onSwipeUpToShow?: () => void;   // New prop for swipe up gesture
}

const ThreeEventDisplay: React.FC<ThreeEventDisplayProps> = ({
  panelData,
  onEventSelect,
  onLikeEvent,
  onDislikeEvent,
  className,
  onSwipeDownToHide, // Destructure new prop
  onSwipeUpToShow    // Destructure new prop
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isDragging, setIsDragging] = useState(false); // Flag for horizontal dragging
  const [startX, setStartX] = useState(0);
  const [translateX, setTranslateX] = useState(0);
  const [initialClientY, setInitialClientY] = useState(0); // For vertical swipe
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

  // New state to track the primary drag direction
  const [dragDirection, setDragDirection] = useState<'none' | 'horizontal' | 'vertical'>('none');

  // Touch handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    setStartX(e.touches[0].clientX);
    setInitialClientY(e.touches[0].clientY);
    setTranslateX(0); // Reset translation on new touch
    setDragDirection('none'); // Reset drag direction
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (dragDirection === 'none') {
      const currentX = e.touches[0].clientX;
      const currentY = e.touches[0].clientY;
      const diffX = currentX - startX;
      const diffY = currentY - initialClientY;
      const sensitivity = 10; // Minimum movement to determine direction

      if (Math.abs(diffX) > sensitivity || Math.abs(diffY) > sensitivity) {
        if (Math.abs(diffX) > Math.abs(diffY)) {
          setDragDirection('horizontal');
          setIsDragging(true); // Enable horizontal dragging
        } else {
          setDragDirection('vertical');
          // Important: prevent default only when vertical drag is determined
          e.preventDefault(); 
        }
      }
    }

    if (dragDirection === 'horizontal') {
      const currentX = e.touches[0].clientX;
      const diffX = currentX - startX;
      setTranslateX(diffX);
    } else if (dragDirection === 'vertical') {
      // Keep preventing default if confirmed vertical
      e.preventDefault(); 
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const horizontalSwipeThreshold = 80;
    const verticalSwipeThreshold = 50; // pixels

    if (dragDirection === 'horizontal') {
      if (Math.abs(translateX) > horizontalSwipeThreshold) {
        if (translateX > 0 && currentPage > 0) {
          setCurrentIndex((currentPage - 1) * eventsPerPage);
        } else if (translateX < 0 && currentPage < totalPages - 1) {
          setCurrentIndex((currentPage + 1) * eventsPerPage);
        }
      }
    } else if (dragDirection === 'vertical') {
      const finalY = e.changedTouches[0].clientY;
      const swipeDistanceY = finalY - initialClientY;

      if (swipeDistanceY > verticalSwipeThreshold) { // Swiped down
        onSwipeDownToHide?.();
      } else if (swipeDistanceY < -verticalSwipeThreshold) { // Swiped up
        onSwipeUpToShow?.();
      }
    }
    
    // Reset all dragging states and direction
    setIsDragging(false);
    setTranslateX(0);
    setDragDirection('none');
  };

  // Mouse handlers for desktop (similar logic to touch handlers)
  const handleMouseDown = (e: React.MouseEvent) => {
    setStartX(e.clientX);
    setInitialClientY(e.clientY);
    setTranslateX(0); // Reset translation on new click
    setDragDirection('none'); // Reset drag direction
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (dragDirection === 'none') {
      const currentX = e.clientX;
      const currentY = e.clientY;
      const diffX = currentX - startX;
      const diffY = currentY - initialClientY;
      const sensitivity = 10; // Minimum movement to determine direction

      if (Math.abs(diffX) > sensitivity || Math.abs(diffY) > sensitivity) {
        if (Math.abs(diffX) > Math.abs(diffY)) {
          setDragDirection('horizontal');
          setIsDragging(true); // Enable horizontal dragging
        } else {
          setDragDirection('vertical');
          // Important: prevent text selection for vertical drag
          e.preventDefault(); 
        }
      }
    }

    if (dragDirection === 'horizontal') {
      const currentX = e.clientX;
      const diffX = currentX - startX;
      setTranslateX(diffX);
    } else if (dragDirection === 'vertical') {
      // Keep preventing default if confirmed vertical
      e.preventDefault(); 
    }
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    const horizontalSwipeThreshold = 80;
    const verticalSwipeThreshold = 50; // pixels

    if (dragDirection === 'horizontal') {
      if (Math.abs(translateX) > horizontalSwipeThreshold) {
        if (translateX > 0 && currentPage > 0) {
          setCurrentIndex((currentPage - 1) * eventsPerPage);
        } else if (translateX < 0 && currentPage < totalPages - 1) {
          setCurrentIndex((currentPage + 1) * eventsPerPage);
        }
      }
    } else if (dragDirection === 'vertical') {
      const finalY = e.clientY;
      const swipeDistanceY = finalY - initialClientY;

      if (swipeDistanceY > verticalSwipeThreshold) { // Swiped down
        onSwipeDownToHide?.();
      } else if (swipeDistanceY < -verticalSwipeThreshold) { // Swiped up
        onSwipeUpToShow?.();
      }
    }

    // Reset all dragging states and direction
    setIsDragging(false);
    setTranslateX(0);
    setDragDirection('none');
  };

  // Add global mouse event listeners (for when drag ends outside the component)
  React.useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => {
      // This listener is primarily for when the mouse is dragged outside the component before release.
      // It only needs to track if dragging is ongoing, not trigger page changes directly.
      if (dragDirection === 'horizontal' && containerRef.current && !containerRef.current.contains(e.target as Node)) {
        const diffX = e.clientX - startX;
        setTranslateX(diffX);
      }
      // Vertical dragging is handled by local mousemove, and its end is also local.
    };

    const handleGlobalMouseUp = () => {
      // This handles the case where the mouse button is released outside the component
      // after a drag started inside it.
      if (dragDirection === 'horizontal') {
        setIsDragging(false);
        setTranslateX(0); // Snap back if not released over the component
      }
      // Vertical drag reset is handled by the local mouseUp, so no need here.
      setDragDirection('none'); // Ensure direction is reset if mouseup happens globally
    };


    if (dragDirection !== 'none') { // Only attach if a drag is potentially active
      document.addEventListener('mousemove', handleGlobalMouseMove);
      document.addEventListener('mouseup', handleGlobalMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleGlobalMouseMove);
      document.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [dragDirection, startX, translateX]);
  

  if (displayEvents.length === 0) return null;

  return (
    <div className={cn("w-full space-y-2", className)}>

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
        <div className="flex justify-center pt-1 pb-0.5">
          <div className="w-8 h-1 bg-white-500 rounded-full cursor-grab active:cursor-grabbing opacity-70" />
        </div>
        {/* Optional: A subtle down arrow to reinforce the swipe direction */}
        <div className="flex justify-center -mt-0.5 pb-1">
            <ChevronDown className="h-4 w-4 text-white-400 opacity-60" />
        </div>
        <div
          className="flex gap-1.5 transition-transform duration-300 ease-out cursor-grab active:cursor-grabbing select-none"
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
                className="flex-shrink-0 w-[32%] bg-black rounded-2xl overflow-hidden cursor-pointer transform transition-transform hover:scale-105"
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
                  
                  {/* Action Buttons - stack top-right */}
                  <div className="absolute top-2 right-2 z-10 flex flex-col items-end gap-1">
                    {/* Like Button */}
                    {onLikeEvent && 'id' in event && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="bg-black/50 hover:bg-black/70 text-white rounded-full p-2"
                        onClick={async (e) => {
                          e.stopPropagation();
                          await onLikeEvent(event.id);
                          setRefreshTrigger(prev => prev + 1);
                        }}
                      >
                        <Heart className="w-4 h-4" />
                        <span className="ml-1 text-sm">{'likes' in event ? event.likes || 0 : 0}</span>
                      </Button>
                    )}

                    {/* Dislike Button */}
                    {onDislikeEvent && 'id' in event && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="bg-black/70 hover:bg-red-600/80 text-white rounded-full p-2"
                        onClick={async (e) => {
                          e.stopPropagation();
                          await onDislikeEvent(event.id);
                        }}
                        title="Event ausblenden"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                  
                  {/* Dislike Button moved under heart in top-right actions */}
                  
                  {/* Event Details mit Like Avatars */}
                  <div className="absolute bottom-0 left-0 right-0 p-3">
                    <h3 className="text-white font-bold text-sm mb-1 line-clamp-4 leading-tight">
                      {event.title}
                    </h3>
                    
                    <div className="flex items-center justify-between">
                      <div className="text-gray-300 text-xs">
                        {'time' in event && event.time && event.time}
                        {'location' in event && event.location && ` • ${event.location}`}
                        
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
        <div className="flex justify-center gap-2 pt-1">
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