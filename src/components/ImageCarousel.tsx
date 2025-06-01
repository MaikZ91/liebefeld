
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
      className={cn("relative w-full overflow-hidden rounded-3xl shadow-2xl border border-gray-700/30", className)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Image container with proper aspect ratio and no clipping */}
      <div className="relative w-full aspect-[16/10] overflow-hidden bg-gradient-to-br from-gray-900 via-black to-gray-800">
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
            <div className="relative w-full h-full flex items-center justify-center">
              {/* Background blur effect for aesthetic */}
              <img 
                src={image.src} 
                alt={image.alt}
                className="absolute inset-0 w-full h-full object-cover blur-sm scale-110 opacity-20"
              />
              {/* Main image - properly centered and contained */}
              <img 
                src={image.src} 
                alt={image.alt}
                className="relative max-w-full max-h-full object-contain z-10 drop-shadow-2xl rounded-xl"
                style={{ maxHeight: '90%', maxWidth: '90%' }}
              />
              {/* Elegant gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/30 z-20" />
            </div>
          </div>
        ))}
      </div>
      
      {/* Premium navigation arrows */}
      <Button 
        onClick={goToPrevious}
        className="absolute left-6 top-1/2 -translate-y-1/2 z-30 bg-white/10 hover:bg-white/20 text-white rounded-full p-4 backdrop-blur-md border border-white/30 transition-all duration-300 hover:scale-110 hover:shadow-xl"
        size="icon"
        variant="ghost"
      >
        <ChevronLeft className="h-6 w-6" />
      </Button>
      
      <Button 
        onClick={goToNext}
        className="absolute right-6 top-1/2 -translate-y-1/2 z-30 bg-white/10 hover:bg-white/20 text-white rounded-full p-4 backdrop-blur-md border border-white/30 transition-all duration-300 hover:scale-110 hover:shadow-xl"
        size="icon"
        variant="ghost"
      >
        <ChevronRight className="h-6 w-6" />
      </Button>
      
      {/* Premium indicators with smooth animations */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-30 flex gap-3">
        {images.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={cn(
              "transition-all duration-500 rounded-full border border-white/40 backdrop-blur-sm",
              index === currentIndex 
                ? "w-10 h-3 bg-white shadow-lg scale-110" 
                : "w-3 h-3 bg-white/40 hover:bg-white/70 hover:scale-125"
            )}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
      
      {/* Enhanced caption overlay with better typography */}
      <div className="absolute bottom-20 left-0 w-full text-center z-30 text-white px-8">
        <div className="max-w-4xl mx-auto backdrop-blur-sm bg-black/20 rounded-2xl py-6 px-8 border border-white/10">
          <h3 className="text-4xl md:text-5xl font-bold text-white mb-4 drop-shadow-2xl font-serif tracking-wide">
            Community Momente
          </h3>
          <p className="text-white/95 text-xl md:text-2xl leading-relaxed drop-shadow-lg font-light tracking-wide">
            Erlebe unsere einzigartigen Events und werde Teil einer lebendigen Gemeinschaft
          </p>
        </div>
      </div>
      
      {/* Elegant progress bar */}
      <div className="absolute top-0 left-0 w-full h-1 bg-white/10 z-30 rounded-t-3xl overflow-hidden">
        <div 
          className="h-full bg-gradient-to-r from-red-500 via-purple-500 to-blue-500 transition-all duration-500 ease-out"
          style={{ 
            width: `${((currentIndex + 1) / images.length) * 100}%` 
          }}
        />
      </div>
      
      {/* Corner decoration */}
      <div className="absolute top-4 right-4 z-30">
        <div className="bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 border border-white/20">
          <span className="text-white/80 text-sm font-medium">
            {currentIndex + 1} / {images.length}
          </span>
        </div>
      </div>
    </div>
  );
};

export default ImageCarousel;
