
import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from './ui/button';
import { cn } from '@/lib/utils';

interface CarouselImage {
  src: string;
  alt: string;
}

interface ImageCarouselProps {
  images: CarouselImage[];
  autoSlideInterval?: number;
  className?: string;
}

const ImageCarousel: React.FC<ImageCarouselProps> = ({ 
  images, 
  autoSlideInterval = 7000,
  className = ""
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  
  // Auto-slide functionality that pauses on hover
  useEffect(() => {
    if (isHovered) return;
    
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length);
    }, autoSlideInterval);
    
    return () => clearInterval(interval);
  }, [images.length, autoSlideInterval, isHovered]);
  
  const goToPrevious = () => {
    setCurrentIndex((prevIndex) => 
      prevIndex === 0 ? images.length - 1 : prevIndex - 1
    );
  };
  
  const goToNext = () => {
    setCurrentIndex((prevIndex) => 
      (prevIndex + 1) % images.length
    );
  };
  
  const goToSlide = (index: number) => {
    setCurrentIndex(index);
  };
  
  if (!images.length) return null;
  
  return (
    <div 
      className={cn("relative w-full overflow-hidden rounded-2xl shadow-2xl border border-gray-800/50", className)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Image container with enhanced transitions */}
      <div className="relative w-full h-[60vh] md:h-[70vh] overflow-hidden bg-gradient-to-br from-gray-900 via-black to-gray-900">
        {images.map((image, index) => (
          <div 
            key={index}
            className={cn(
              "absolute inset-0 w-full h-full transition-all duration-1000 ease-in-out",
              index === currentIndex 
                ? "opacity-100 scale-100 z-10" 
                : "opacity-0 scale-105 z-0"
            )}
          >
            <div className="relative w-full h-full">
              {/* Background blur effect */}
              <img 
                src={image.src} 
                alt={image.alt}
                className="absolute inset-0 w-full h-full object-cover blur-sm scale-110 opacity-30"
              />
              {/* Main image */}
              <img 
                src={image.src} 
                alt={image.alt}
                className="relative w-full h-full object-contain z-10 drop-shadow-2xl"
              />
              {/* Gradient overlay for better text readability */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20 z-20" />
            </div>
          </div>
        ))}
      </div>
      
      {/* Enhanced navigation arrows */}
      <Button 
        onClick={goToPrevious}
        className="absolute left-6 top-1/2 -translate-y-1/2 z-30 bg-black/40 hover:bg-black/60 text-white rounded-full p-3 backdrop-blur-sm border border-white/20 transition-all duration-300 hover:scale-110"
        size="icon"
        variant="ghost"
      >
        <ChevronLeft className="h-6 w-6" />
      </Button>
      
      <Button 
        onClick={goToNext}
        className="absolute right-6 top-1/2 -translate-y-1/2 z-30 bg-black/40 hover:bg-black/60 text-white rounded-full p-3 backdrop-blur-sm border border-white/20 transition-all duration-300 hover:scale-110"
        size="icon"
        variant="ghost"
      >
        <ChevronRight className="h-6 w-6" />
      </Button>
      
      {/* Enhanced indicators */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-30 flex gap-3">
        {images.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={cn(
              "transition-all duration-300 rounded-full border border-white/30",
              index === currentIndex 
                ? "w-8 h-3 bg-white shadow-lg" 
                : "w-3 h-3 bg-white/50 hover:bg-white/80 hover:scale-110"
            )}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
      
      {/* Enhanced caption overlay */}
      <div className="absolute bottom-16 left-0 w-full text-center z-30 text-white px-8">
        <div className="max-w-4xl mx-auto">
          <h3 className="text-3xl md:text-4xl font-bold text-white mb-4 drop-shadow-2xl font-serif">
            Community Momente
          </h3>
          <p className="text-white/95 text-lg md:text-xl leading-relaxed drop-shadow-lg">
            Erlebe unsere einzigartigen Events und werde Teil einer lebendigen Gemeinschaft
          </p>
        </div>
      </div>
      
      {/* Progress bar */}
      <div className="absolute top-0 left-0 w-full h-1 bg-white/20 z-30">
        <div 
          className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-300"
          style={{ 
            width: `${((currentIndex + 1) / images.length) * 100}%` 
          }}
        />
      </div>
    </div>
  );
};

export default ImageCarousel;
