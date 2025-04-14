import React, { useState, useEffect } from 'react';
import { Calendar, Users, X, UsersRound } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';

type AdEvent = {
  title: string;
  date: string;
  location: string;
  imageUrl: string;
  link?: string;
};

interface AdPanelProps {
  className?: string;
}

const AdPanel: React.FC<AdPanelProps> = ({ className }) => {
  const [isVisible, setIsVisible] = useState(true);
  const [currentAd, setCurrentAd] = useState(0);
  
  const adEvents: AdEvent[] = [
    {
      title: 'Tribe Kennenlernabend',
      date: 'Immer am letzten Sonntag im Monat',
      location: 'Anmeldung in der Community',
      imageUrl: '/lovable-uploads/83f7c05b-0e56-4f3c-a19c-adeab5429b59.jpg',
      link: "https://chat.whatsapp.com/C13SQuimtp0JHtx5x87uxK"
    }
  ];
  
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
              <img 
                src={ad.imageUrl} 
                alt={ad.title} 
                className="w-full h-full object-cover"
                onError={(e) => {
                  console.error(`Failed to load ad image: ${ad.imageUrl}`);
                  e.currentTarget.src = "https://images.unsplash.com/photo-1649972904349-6e44c42644a7?auto=format&fit=crop&w=800&q=80";
                }}
              />
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
                <Calendar className="w-4 h-4 mr-1.5 flex-shrink-0" />
                {ad.date}
              </motion.div>
              
              <motion.div 
                className="flex items-center text-white/90 text-sm mb-3"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <UsersRound className="w-4 h-4 mr-1.5 flex-shrink-0" />
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
                      className="bg-red-600 hover:bg-red-700 text-white border-none w-full"
                    >
                      <Users className="w-4 h-4 mr-2" />
                      Community beitreten
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
