import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Users, ChevronUp } from 'lucide-react';
import { PanelEventData, PanelEvent } from './types';
import { cn } from '@/lib/utils';

interface ThreeEventDisplayProps {
  panelData: PanelEventData;
  onEventSelect?: (eventId: string) => void;
  className?: string;
}

const ThreeEventDisplay: React.FC<ThreeEventDisplayProps> = ({
  panelData,
  onEventSelect,
  className
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [translateX, setTranslateX] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const totalEvents = panelData.events.length;
  const maxIndex = Math.max(0, totalEvents - 3);

  // Get current 3 events to display
  const displayEvents = panelData.events.slice(currentIndex, currentIndex + 3);

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
      if (translateX > 0 && currentIndex > 0) {
        setCurrentIndex(prev => Math.max(0, prev - 1));
      } else if (translateX < 0 && currentIndex < maxIndex) {
        setCurrentIndex(prev => Math.min(maxIndex, prev + 1));
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
      if (translateX > 0 && currentIndex > 0) {
        setCurrentIndex(prev => Math.max(0, prev - 1));
      } else if (translateX < 0 && currentIndex < maxIndex) {
        setCurrentIndex(prev => Math.min(maxIndex, prev + 1));
      }
    }
    
    setTranslateX(0);
  };

  if (displayEvents.length === 0) return null;

  return (
    <div className={cn("w-full space-y-4", className)}>
      {/* Perfect Day Button and Action Buttons */}
      <div className="flex justify-between items-center px-4">
        <Button className="bg-black text-white hover:bg-gray-900 px-6 py-2 rounded-full font-semibold">
          <span className="text-purple-400 mr-2">✨</span>
          Perfect Day
        </Button>
        
        <div className="flex gap-2">
          <Button className="bg-black text-red-500 hover:bg-gray-900 px-4 py-2 rounded-full font-bold border border-red-500/30">
            <Users className="w-4 h-4 mr-1" />
            Find YOUR Tribe
          </Button>
          <Button className="bg-black text-red-500 hover:bg-gray-900 px-4 py-2 rounded-full font-bold border border-red-500/30">
            Ich bin hier!
          </Button>
        </div>
      </div>

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
                  
                  {/* Event Details */}
                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    <h3 className="text-white font-bold text-lg mb-2 line-clamp-2">
                      {event.title}
                    </h3>
                    <div className="text-gray-300 text-sm space-y-1">
                      <div>{event.date}</div>
                      {'time' in event && event.time && (
                        <div>{event.time}</div>
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
          {Array.from({ length: Math.ceil(totalEvents / 3) }).map((_, index) => (
            <div
              key={index}
              className={cn(
                "w-2 h-2 rounded-full transition-all",
                Math.floor(currentIndex / 3) === index ? "bg-white" : "bg-white/40"
              )}
            />
          ))}
        </div>
      )}


      {/* Events Counter with Arrow */}
      <div className="flex items-center justify-between px-4 py-2">
        <span className="text-white font-semibold text-lg">
          {totalEvents} Events
        </span>
        <ChevronUp className="w-6 h-6 text-white" />
      </div>
    </div>
  );
};

export default ThreeEventDisplay;