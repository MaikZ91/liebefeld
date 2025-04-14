
import React, { useState, useEffect } from 'react';
import { Calendar, Users, X, UsersRound, Music, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';

type AdEvent = {
  title: string;
  date: string;
  location: string;
  imageUrl: string;
  link?: string;
  type?: string;
};

interface AdPanelProps {
  className?: string;
}

const AdPanel: React.FC<AdPanelProps> = ({ className }) => {
  const [isVisible, setIsVisible] = useState(true);
  const [currentAd, setCurrentAd] = useState(0);
  const [imageError, setImageError] = useState<Record<number, boolean>>({});
  
  const adEvents: AdEvent[] = [
    {
      title: 'Tribe Kennenlernabend',
      date: 'Immer am letzten Sonntag im Monat',
      location: 'Anmeldung in der Community',
      imageUrl: '/lovable-uploads/83f7c05b-0e56-4f3c-a19c-adeab5429b59.jpg',
      link: "https://chat.whatsapp.com/C13SQuimtp0JHtx5x87uxK",
      type: "event"
    },
    {
      title: 'Patrick Pilgrim Blues Rock',
      date: 'Jetzt anhören und buchen',
      location: 'Für Events & Veranstaltungen',
      imageUrl: '/lovable-uploads/b51c79e9-def5-4f57-ac47-ddbf5d443c49.png', // We'll force clear the cache with a timestamp
      link: "https://patrickpilgrim.de/",
      type: "music"
    }
  ];
  
  // Force re-render of images with timestamp to bypass caching
  useEffect(() => {
    const timestamp = new Date().getTime();
    adEvents.forEach((ad, index) => {
      // Add a timestamp query parameter to force reload
      if (ad.imageUrl.includes('lovable-uploads')) {
        console.log(`Original image URL for ${ad.title}: ${ad.imageUrl}`);
        const imageWithoutCache = `${ad.imageUrl}?t=${timestamp}`;
        console.log(`Modified image URL with cache busting: ${imageWithoutCache}`);
        adEvents[index].imageUrl = imageWithoutCache;
      }
    });
  }, []);
  
  useEffect(() => {
    if (adEvents.length <= 1) return;
    
    const interval = setInterval(() => {
      setCurrentAd((prev) => (prev + 1) % adEvents.length);
    }, 8000);
    
    return () => clearInterval(interval);
  }, [adEvents.length]);
  
  const handleDismiss = () => {
    setIsVisible(false);
    setTimeout(() => setIsVisible(true), 60 * 60 * 1000);
  };
  
  // Log the current image URL when it changes
  useEffect(() => {
    if (adEvents.length === 0) return;
    const currentAdObj = adEvents[currentAd];
    console.log(`Displaying ad [${currentAd}]: "${currentAdObj.title}" with image: ${currentAdObj.imageUrl}`);
  }, [currentAd, adEvents]);
  
  if (!isVisible || adEvents.length === 0) return null;
  
  const ad = adEvents[currentAd];
  
  return (
    <AnimatePresence>
      <motion.div 
        className={`relative overflow-hidden rounded-xl dark-glass-card border border-white/10 shadow-lg ${className}`}
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
        
        <div className="relative h-full w-full">
          <div className="absolute inset-0 overflow-hidden rounded-xl">
            {ad.imageUrl && (
              <>
                <img 
                  key={`ad-image-${currentAd}-${ad.imageUrl}`}
                  src={ad.imageUrl} 
                  alt={ad.title} 
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    console.error(`Failed to load ad image: ${ad.imageUrl}`);
                    setImageError(prev => ({...prev, [currentAd]: true}));
                    
                    // Try without cache busting query parameter if it exists
                    const originalUrl = ad.imageUrl.split('?')[0];
                    console.log(`Trying fallback image without cache params: ${originalUrl}`);
                    e.currentTarget.src = originalUrl;
                    
                    // If it fails again, use the placeholder
                    e.currentTarget.onerror = () => {
                      console.error(`Fallback also failed, using placeholder`);
                      e.currentTarget.src = "https://images.unsplash.com/photo-1649972904349-6e44c42644a7?auto=format&fit=crop&w=800&q=80";
                    };
                  }}
                  onLoad={() => {
                    console.log(`Successfully loaded image: ${ad.imageUrl}`);
                    setImageError(prev => ({...prev, [currentAd]: false}));
                  }}
                  style={{ objectPosition: 'center center' }}
                />
                {imageError[currentAd] && (
                  <div className="absolute bottom-0 right-0 bg-red-600 text-white text-xs px-1 py-0.5 rounded-tl-md">
                    Error loading image
                  </div>
                )}
              </>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent"></div>
          </div>
          
          <div className="relative p-4 flex flex-col h-full">
            <div className="self-start mb-auto">
              <motion.span 
                className="text-xs bg-white/20 backdrop-blur-sm rounded-full px-2 py-0.5 text-white font-medium"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                Gesponsert
              </motion.span>
            </div>
            
            <div className="mt-auto">
              <motion.h3 
                className="text-xl md:text-2xl font-bold text-white mb-2"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                {ad.title}
              </motion.h3>
              
              <motion.div 
                className="flex items-center text-white/90 text-sm mb-1"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                {ad.type === "music" ? (
                  <Music className="w-4 h-4 mr-1.5 flex-shrink-0" />
                ) : (
                  <Calendar className="w-4 h-4 mr-1.5 flex-shrink-0" />
                )}
                {ad.date}
              </motion.div>
              
              <motion.div 
                className="flex items-center text-white/90 text-sm mb-3"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                {ad.type === "music" ? (
                  <ExternalLink className="w-4 h-4 mr-1.5 flex-shrink-0" />
                ) : (
                  <UsersRound className="w-4 h-4 mr-1.5 flex-shrink-0" />
                )}
                {ad.location}
              </motion.div>
              
              {ad.link && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  <a 
                    href={ad.link}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Button 
                      className={`${ad.type === "music" ? "bg-blue-600 hover:bg-blue-700" : "bg-red-600 hover:bg-red-700"} text-white border-none w-full`}
                    >
                      {ad.type === "music" ? (
                        <>
                          <Music className="w-4 h-4 mr-2" />
                          Jetzt anhören
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
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default AdPanel;
