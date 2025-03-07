
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
}

const ImageCarousel: React.FC<ImageCarouselProps> = ({ 
  images, 
  autoSlideInterval = 5000 
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  
  // Auto-slide functionality
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length);
    }, autoSlideInterval);
    
    return () => clearInterval(interval);
  }, [images.length, autoSlideInterval]);
  
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
    <div className="relative w-full overflow-hidden rounded-xl shadow-xl my-8">
      {/* Image container with smooth transitions */}
      <div 
        className="relative w-full h-[500px] overflow-hidden"
      >
        {images.map((image, index) => (
          <div 
            key={index}
            className={cn(
              "absolute inset-0 w-full h-full transition-opacity duration-1000 ease-in-out",
              index === currentIndex ? "opacity-100 z-10" : "opacity-0 z-0"
            )}
          >
            <img 
              src={image.src} 
              alt={image.alt}
              className="w-full h-full object-cover object-center"
            />
            
            {/* Dark gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
          </div>
        ))}
      </div>
      
      {/* Navigation arrows */}
      <Button 
        onClick={goToPrevious}
        className="absolute left-4 top-1/2 -translate-y-1/2 z-20 bg-black/30 hover:bg-black/50 text-white rounded-full p-2"
        size="icon"
        variant="ghost"
      >
        <ChevronLeft className="h-8 w-8" />
      </Button>
      
      <Button 
        onClick={goToNext}
        className="absolute right-4 top-1/2 -translate-y-1/2 z-20 bg-black/30 hover:bg-black/50 text-white rounded-full p-2"
        size="icon"
        variant="ghost"
      >
        <ChevronRight className="h-8 w-8" />
      </Button>
      
      {/* Indicators */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex gap-2">
        {images.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={cn(
              "w-3 h-3 rounded-full transition-all duration-300",
              index === currentIndex 
                ? "bg-white scale-110 opacity-100" 
                : "bg-white/50 opacity-70 hover:opacity-90"
            )}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
      
      {/* Caption overlay (if needed) */}
      <div className="absolute bottom-12 left-0 w-full text-center z-20 text-white px-6">
        <h3 className="text-2xl font-bold text-white mb-2 drop-shadow-md">
          Community Momente
        </h3>
        <p className="text-white/90 max-w-3xl mx-auto text-lg">
          Erlebe unsere einzigartigen Events und werde Teil der Gemeinschaft
        </p>
      </div>
    </div>
  );
};

export default ImageCarousel;
