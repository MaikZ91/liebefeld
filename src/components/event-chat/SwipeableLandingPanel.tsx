
// src/components/event-chat/SwipeableLandingPanel.tsx
import React, { useState, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Users, MessageSquare, Calendar, Heart, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface LandingSlide {
  title: string;
  description: string;
  imageUrl: string;
  buttonText: string;
  buttonAction: () => void;
  iconType?: string;
  backgroundColor?: string;
}

export interface LandingSlideData {
  slides: LandingSlide[];
  currentIndex: number;
}

interface SwipeableLandingPanelProps {
  slideData: LandingSlideData;
  className?: string;
}

const SwipeableLandingPanel: React.FC<SwipeableLandingPanelProps> = ({
  slideData,
  className
}) => {
  const [currentIndex, setCurrentIndex] = useState(slideData.currentIndex || 0);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [translateX, setTranslateX] = useState(0);
  const panelRef = useRef<HTMLDivElement>(null);
  
  const currentSlide = slideData.slides[currentIndex];
  
  const handlePrevious = () => {
    setCurrentIndex((prev) => 
      prev === 0 ? slideData.slides.length - 1 : prev - 1
    );
  };
  
  const handleNext = () => {
    setCurrentIndex((prev) => 
      prev === slideData.slides.length - 1 ? 0 : prev + 1
    );
  };

  // Touch event handlers for swipe functionality
  const handleTouchStart = (e: React.TouchEvent) => {
    if (slideData.slides.length <= 1) return;
    setIsDragging(true);
    setStartX(e.touches[0].clientX);
    setTranslateX(0);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || slideData.slides.length <= 1) return;
    const currentX = e.touches[0].clientX;
    const diffX = currentX - startX;
    setTranslateX(diffX);
  };

  const handleTouchEnd = () => {
    if (!isDragging || slideData.slides.length <= 1) return;
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
    if (slideData.slides.length <= 1) return;
    setIsDragging(true);
    setStartX(e.clientX);
    setTranslateX(0);
  };

  // Add global mouse event listeners
  useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (!isDragging || slideData.slides.length <= 1) return;
      const diffX = e.clientX - startX;
      setTranslateX(diffX);
    };

    const handleGlobalMouseUp = () => {
      if (!isDragging || slideData.slides.length <= 1) return;
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
  }, [isDragging, startX, translateX, slideData.slides.length]);
  
  // Function to render the appropriate icon based on iconType
  const renderIcon = (iconType?: string) => {
    switch (iconType) {
      case 'users':
        return <Users className="w-5 h-5" />;
      case 'message-square':
        return <MessageSquare className="w-5 h-5" />;
      case 'calendar':
        return <Calendar className="w-5 h-5" />;
      case 'heart':
        return <Heart className="w-5 h-5" />;
      default:
        return null;
    }
  };

  const handleClick = () => {
    if (Math.abs(translateX) > 10) return; // Prevent click if swiping
    currentSlide.buttonAction();
  };
  
  if (!currentSlide) return null;

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

      {/* Swipe Instructions */}
      {slideData.slides.length > 1 && !isDragging && (
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-xs text-gray-400 opacity-70">
          ← Wischen zum Navigieren →
        </div>
      )}
    </div>
  );
};

export default SwipeableLandingPanel;
