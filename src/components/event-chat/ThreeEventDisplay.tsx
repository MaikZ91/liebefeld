import React, { useState, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Users, Heart, MessageSquare, Calendar, ExternalLink, Music, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { PanelEventData, PanelEvent } from './types';
import { useEventContext } from '@/contexts/EventContext';
import EventLikeAvatars from './EventLikeAvatars';
import { motion } from 'framer-motion';

interface ThreeEventDisplayProps {
  panelData: PanelEventData;
  onEventSelect?: (eventId: string) => void;
  onLikeEvent?: (eventId: string) => void;
  onJoinEventChat?: (eventId: string, eventTitle: string) => void;
  className?: string;
  onSwipeDownToHide?: () => void;
  onSwipeUpToShow?: () => void;
}

const ThreeEventDisplay: React.FC<ThreeEventDisplayProps> = ({
  panelData,
  onEventSelect,
  onLikeEvent,
  onJoinEventChat,
  className,
  onSwipeDownToHide,
  onSwipeUpToShow
}) => {
  const { handleLikeEvent, events } = useEventContext();
  const [currentIndex, setCurrentIndex] = useState(panelData.currentIndex || 0);
  const [isLiking, setIsLiking] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [translateX, setTranslateX] = useState(0);
  const [initialClientY, setInitialClientY] = useState(0);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  
  const containerRef = useRef<HTMLDivElement>(null);

  const totalEvents = panelData.events.length;
  const eventsPerPage = 3;
  const totalPages = Math.ceil(totalEvents / eventsPerPage);

  const currentPage = Math.floor(currentIndex / eventsPerPage);
  const startIndex = currentPage * eventsPerPage;
  const displayEvents = panelData.events.slice(startIndex, startIndex + eventsPerPage);

  const handleEventClick = (event: PanelEvent) => {
    if (Math.abs(translateX) > 10) return;
    if ('id' in event && onEventSelect) {
      onEventSelect(event.id);
    }
  };

  const [dragDirection, setDragDirection] = useState<'none' | 'horizontal' | 'vertical'>('none');

  const handleTouchStart = (e: React.TouchEvent) => {
    setStartX(e.touches[0].clientX);
    setInitialClientY(e.touches[0].clientY);
    setTranslateX(0);
    setDragDirection('none');
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (dragDirection === 'none') {
      const currentX = e.touches[0].clientX;
      const currentY = e.touches[0].clientY;
      const diffX = currentX - startX;
      const diffY = currentY - initialClientY;
      const sensitivity = 10;

      if (Math.abs(diffX) > sensitivity || Math.abs(diffY) > sensitivity) {
        if (Math.abs(diffX) > Math.abs(diffY)) {
          setDragDirection('horizontal');
          setIsDragging(true);
        } else {
          setDragDirection('vertical');
          e.preventDefault(); 
        }
      }
    }

    if (dragDirection === 'horizontal') {
      const currentX = e.touches[0].clientX;
      const diffX = currentX - startX;
      setTranslateX(diffX);
    } else if (dragDirection === 'vertical') {
      e.preventDefault(); 
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const horizontalSwipeThreshold = 80;
    const verticalSwipeThreshold = 50;

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

      if (swipeDistanceY > verticalSwipeThreshold) {
        onSwipeDownToHide?.();
      } else if (swipeDistanceY < -verticalSwipeThreshold) {
        onSwipeUpToShow?.();
      }
    }
    
    setIsDragging(false);
    setTranslateX(0);
    setDragDirection('none');
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setStartX(e.clientX);
    setInitialClientY(e.clientY);
    setTranslateX(0);
    setDragDirection('none');
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (dragDirection === 'none') {
      const currentX = e.clientX;
      const currentY = e.clientY;
      const diffX = currentX - startX;
      const diffY = currentY - initialClientY;
      const sensitivity = 10;

      if (Math.abs(diffX) > sensitivity || Math.abs(diffY) > sensitivity) {
        if (Math.abs(diffX) > Math.abs(diffY)) {
          setDragDirection('horizontal');
          setIsDragging(true);
        } else {
          setDragDirection('vertical');
          e.preventDefault(); 
        }
      }
    }

    if (dragDirection === 'horizontal') {
      const currentX = e.clientX;
      const diffX = currentX - startX;
      setTranslateX(diffX);
    } else if (dragDirection === 'vertical') {
      e.preventDefault(); 
    }
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    const horizontalSwipeThreshold = 80;
    const verticalSwipeThreshold = 50;

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

      if (swipeDistanceY > verticalSwipeThreshold) {
        onSwipeDownToHide?.();
      } else if (swipeDistanceY < -verticalSwipeThreshold) {
        onSwipeUpToShow?.();
      }
    }

    setIsDragging(false);
    setTranslateX(0);
    setDragDirection('none');
  };

  React.useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (dragDirection === 'horizontal' && containerRef.current && !containerRef.current.contains(e.target as Node)) {
        const diffX = e.clientX - startX;
        setTranslateX(diffX);
      }
    };

    const handleGlobalMouseUp = () => {
      if (dragDirection === 'horizontal') {
        setIsDragging(false);
        setTranslateX(0);
      }
      setDragDirection('none');
    };


    if (dragDirection !== 'none') {
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
    <div className={cn(
      "relative bg-gradient-to-br from-gray-900 to-black rounded-xl overflow-hidden shadow-2xl max-w-md mx-auto select-none",
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
        {/* Slide Image */}
        <div className="relative h-48 overflow-hidden">
          <img
            src={currentSlide.imageUrl}
            alt={currentSlide.title}
            className="w-full h-full object-cover pointer-events-none"
            onError={(e) => {
              e.currentTarget.src = 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=400&h=300&fit=crop';
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          
          {/* Navigation Arrows */}
          {slideData.slides.length > 1 && (
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
          
          {/* Slide Index Indicator */}
          {slideData.slides.length > 1 && (
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
              {slideData.slides.map((_, index) => (
                <div
                  key={index}
                  className={cn(
                    "w-2 h-2 rounded-full transition-all cursor-pointer",
                    index === currentIndex ? "bg-white" : "bg-white/40"
                  )}
                  onClick={() => setCurrentIndex(index)}
                />
              ))}
            </div>
          )}

          {/* Swipe Indicators */}
          {slideData.slides.length > 1 && isDragging && (
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
        
        {/* Slide Content */}
        <div className="p-4 space-y-3">
          {/* Icon and Title */}
          <div className="flex items-center gap-3">
            {currentSlide.iconType && (
              <div className="text-red-400">
                {renderIcon(currentSlide.iconType)}
              </div>
            )}
            <h3 className="text-lg font-semibold text-white line-clamp-2">
              {currentSlide.title}
            </h3>
          </div>
          
          {/* Description */}
          <p className="text-gray-300 text-sm line-clamp-3">
            {currentSlide.description}
          </p>
          
          {/* Action Button */}
          <Button
            onClick={handleClick}
            className="w-full font-medium mt-4 bg-red-500 hover:bg-red-600 text-white"
          >
            {currentSlide.buttonText}
            <ExternalLink className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>

      {/* Swipe Instructions (Horizontal) */}
      {sortedEvents.length > 1 && !isDragging && dragDirection !== 'vertical' && (
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-xs text-gray-400 opacity-70">
          ← Wischen zum Navigieren →
        </div>
      )}

      {/* Subtle Swipe Down to Hide Indicator */}
      {onSwipeDownToHide && !isDragging && (
        <motion.div
          className="absolute bottom-1 right-1/2 translate-x-1/2 text-gray-500 opacity-50 flex flex-col items-center select-none"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            opacity: { duration: 0.5, delay: 1 },
            y: {
              duration: 1.5,
              repeat: Infinity,
              repeatType: "reverse",
              ease: "easeInOut",
              delay: 1
            }
          }}
        >
          <ChevronDown className="h-4 w-4" />
          <span className="text-[9px] mt-0.5 whitespace-nowrap">nach unten wischen</span>
        </motion.div>
      )}
    </div>
  );
};

export default ThreeEventDisplay;