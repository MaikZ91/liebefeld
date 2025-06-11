
// src/components/event-chat/SwipeableLandingPanel.tsx
import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Users, MessageSquare, Calendar, Heart, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface LandingSlide {
  title: string;
  description: string;
  imageUrl: string;
  buttonText: string;
  buttonAction: () => void;
  icon?: React.ReactNode;
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
  
  if (!currentSlide) return null;

  return (
    <div className={cn(
      "relative bg-gradient-to-br from-gray-900 to-black rounded-xl overflow-hidden shadow-2xl max-w-md mx-auto",
      className
    )}>
      {/* Slide Image */}
      <div className="relative h-48 overflow-hidden">
        <img
          src={currentSlide.imageUrl}
          alt={currentSlide.title}
          className="w-full h-full object-cover"
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
      </div>
      
      {/* Slide Content */}
      <div className="p-4 space-y-3">
        {/* Icon and Title */}
        <div className="flex items-center gap-3">
          {currentSlide.icon && (
            <div className="text-red-400">
              {currentSlide.icon}
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
          onClick={currentSlide.buttonAction}
          className="w-full font-medium mt-4 bg-red-500 hover:bg-red-600 text-white"
        >
          {currentSlide.buttonText}
          <ExternalLink className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );
};

export default SwipeableLandingPanel;
