
import React, { useState, useEffect, useRef } from 'react';
import { Calendar, Users, X, UsersRound, Music, ExternalLink, ImageOff } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';

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
  const [adImages, setAdImages] = useState<Record<number, string>>({});
  const [imageLoading, setImageLoading] = useState<Record<number, boolean>>({});
  
  const adEvents: AdEvent[] = [
    {
      title: 'Tribe Kennenlernabend',
      date: 'Immer am letzten Sonntag im Monat',
      location: 'Anmeldung in der Community',
      imageUrl: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?q=80&w=1000',
      link: "https://chat.whatsapp.com/C13SQuimtp0JHtx5x87uxK",
      type: "event"
    },
    {
      title: 'Patrick Pilgrim Blues Rock',
      date: 'Jetzt anhören und buchen',
      location: 'Für Events & Veranstaltungen',
      imageUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=1000',
      link: "https://patrickpilgrim.de/",
      type: "music"
    }
  ];
  
  useEffect(() => {
    // Initialize loading state
    const loadingState: Record<number, boolean> = {};
    adEvents.forEach((_, index) => {
      loadingState[index] = true;
    });
    setImageLoading(loadingState);
    
    // Pre-load images
    adEvents.forEach((ad, index) => {
      const img = new Image();
      img.onload = () => {
        setAdImages(prev => ({ ...prev, [index]: ad.imageUrl }));
        setImageLoading(prev => ({ ...prev, [index]: false }));
        console.log(`Successfully pre-loaded image for ad ${index}: ${ad.imageUrl}`);
      };
      img.onerror = () => {
        // Try a fallback image on error
        const fallbackUrl = 'https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?auto=format&fit=crop&w=800&q=80';
        console.log(`Failed to load ad image ${index}, using fallback: ${fallbackUrl}`);
        setAdImages(prev => ({ ...prev, [index]: fallbackUrl }));
        setImageLoading(prev => ({ ...prev, [index]: false }));
      };
      img.src = ad.imageUrl;
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
  
  // Log the current ad when it changes
  useEffect(() => {
    if (adEvents.length === 0) return;
    const currentAdObj = adEvents[currentAd];
    console.log(`Displaying ad [${currentAd}]: "${currentAdObj.title}" with image status: ${imageLoading[currentAd] ? 'loading' : 'loaded'}`);
  }, [currentAd, adEvents, imageLoading]);
  
  if (!isVisible || adEvents.length === 0) return null;
  
  const ad = adEvents[currentAd];
  const hasLoadedImage = adImages[currentAd] && !imageLoading[currentAd];
  
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
          <div className="absolute inset-0 overflow-hidden rounded-xl bg-gradient-to-br from-gray-900 to-black">
            {adImages[currentAd] ? (
              <img 
                src={adImages[currentAd]} 
                alt={ad.title} 
                className="w-full h-full object-cover transition-opacity duration-500"
                style={{ opacity: hasLoadedImage ? 1 : 0.5 }}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <ImageOff className="w-8 h-8 text-gray-400" />
              </div>
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
