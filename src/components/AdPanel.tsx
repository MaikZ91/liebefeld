
import React, { useState, useEffect } from 'react';
import { Music, Users, ExternalLink, Calendar, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

type Advertisement = {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  imageUrl: string;
  link: string;
  type: 'music' | 'event';
};

interface AdPanelProps {
  className?: string;
}

const AdPanel: React.FC<AdPanelProps> = ({ className }) => {
  const [currentAdIndex, setCurrentAdIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isDismissed, setIsDismissed] = useState(false);
  
  const advertisements: Advertisement[] = [
    {
      id: 'patrick-pilgrim',
      title: 'Patrick Pilgrim',
      subtitle: 'Blues Rock Gitarrist',
      description: 'Buche jetzt für dein Event! Hochwertige Live-Musik für jeden Anlass.',
      imageUrl: '/lovable-uploads/d62d764a-c245-4e68-b2cb-f6ed2de7c5bf.png',
      link: 'https://patrickpilgrim.de/',
      type: 'music'
    },
    {
      id: 'tribe-stammtisch',
      title: 'Tribe Stammtisch',
      subtitle: 'Kennenlernabend',
      description: 'Immer am letzten Sonntag im Monat. Sei dabei und lerne neue Leute kennen!',
      imageUrl: '/lovable-uploads/e9a40a26-0f40-4063-b9d3-6d51c0aa2235.png',
      link: 'https://chat.whatsapp.com/C13SQuimtp0JHtx5x87uxK',
      type: 'event'
    }
  ];
  
  useEffect(() => {
    if (advertisements.length <= 1) return;
    
    const interval = setInterval(() => {
      setCurrentAdIndex((prev) => (prev + 1) % advertisements.length);
      setIsLoading(true);
    }, 8000);
    
    return () => clearInterval(interval);
  }, [advertisements.length]);
  
  const handleDismiss = () => {
    setIsDismissed(true);
    // Show again after an hour
    setTimeout(() => setIsDismissed(false), 60 * 60 * 1000);
  };
  
  const handleImageLoad = () => {
    setIsLoading(false);
  };
  
  const handleImageError = () => {
    setIsLoading(false);
    console.error(`Failed to load ad image for ${advertisements[currentAdIndex].title}`);
  };
  
  if (isDismissed || advertisements.length === 0) {
    return null;
  }
  
  const currentAd = advertisements[currentAdIndex];
  
  return (
    <div className={`my-6 ${className}`}>
      <h2 className="text-xl font-semibold mb-4 text-center text-white">
        Partner & Events
      </h2>
      
      <AnimatePresence>
        <motion.div 
          className="rounded-xl overflow-hidden shadow-lg relative border border-white/10"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.5 }}
        >
          <button 
            onClick={handleDismiss}
            className="absolute top-2 right-2 z-10 bg-black/60 rounded-full p-1 text-white/80 hover:text-white transition-colors"
            aria-label="Werbung schließen"
          >
            <X size={16} />
          </button>
          
          <div className="relative aspect-[16/9] md:aspect-[21/9] w-full overflow-hidden bg-gradient-to-br from-gray-900 to-black">
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-900/40 backdrop-blur-sm">
                <Skeleton className="w-full h-full" />
              </div>
            )}
            
            <img 
              src={currentAd.imageUrl}
              alt={currentAd.title} 
              className="w-full h-full object-cover"
              style={{ display: isLoading ? 'none' : 'block' }}
              onLoad={handleImageLoad}
              onError={handleImageError}
            />
            
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent"></div>
            
            <div className="absolute inset-x-0 bottom-0 p-4 md:p-6">
              <motion.div
                className="flex flex-col gap-1"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <span className="text-xs bg-white/20 backdrop-blur-sm rounded-full px-2 py-0.5 text-white font-medium self-start mb-2">
                  {currentAd.type === 'music' ? 'Künstler' : 'Event'}
                </span>
                
                <h3 className="text-xl md:text-2xl font-bold text-white mb-1">
                  {currentAd.title}
                </h3>
                
                <p className="text-white/90 text-sm mb-2">
                  {currentAd.subtitle}
                </p>
                
                <div className="flex items-center text-white/90 text-sm mb-3">
                  {currentAd.type === 'music' ? (
                    <>
                      <Music className="w-4 h-4 mr-1.5 flex-shrink-0" />
                      {currentAd.description}
                    </>
                  ) : (
                    <>
                      <Calendar className="w-4 h-4 mr-1.5 flex-shrink-0" />
                      {currentAd.description}
                    </>
                  )}
                </div>
                
                <a 
                  href={currentAd.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="self-end"
                >
                  <Button 
                    className={`${currentAd.type === 'music' ? "bg-blue-600 hover:bg-blue-700" : "bg-red-600 hover:bg-red-700"} text-white border-none`}
                  >
                    {currentAd.type === 'music' ? (
                      <>
                        <Music className="w-4 h-4 mr-2" />
                        Mehr Infos
                      </>
                    ) : (
                      <>
                        <Users className="w-4 h-4 mr-2" />
                        Community beitreten
                      </>
                    )}
                  </Button>
                </a>
              </motion.div>
            </div>
          </div>
          
          {advertisements.length > 1 && (
            <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex gap-1.5">
              {advertisements.map((_, index) => (
                <div 
                  key={index}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    index === currentAdIndex 
                      ? 'w-6 bg-white' 
                      : 'w-1.5 bg-white/40'
                  }`}
                ></div>
              ))}
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default AdPanel;
