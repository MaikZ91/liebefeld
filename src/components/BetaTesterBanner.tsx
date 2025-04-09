
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

const BetaTesterBanner: React.FC = () => {
  const [isVisible, setIsVisible] = useState(true);
  const [isFlashing, setIsFlashing] = useState(true);
  
  useEffect(() => {
    // Set up flashing effect interval
    const flashInterval = setInterval(() => {
      setIsFlashing(prev => !prev);
    }, 1500);
    
    return () => clearInterval(flashInterval);
  }, []);
  
  if (!isVisible) return null;
  
  return (
    <div className={`w-full bg-gradient-to-r from-purple-800 to-violet-900 text-white py-2 px-4 flex items-center justify-between transition-all duration-700 ${isFlashing ? 'bg-opacity-100' : 'bg-opacity-80'}`}>
      <div className="flex-1"></div>
      <div className="flex items-center justify-center flex-grow">
        <span className="mr-2 font-medium">Werde Beta Tester unserer App</span>
        <a 
          href="https://drive.google.com/uc?export=download&id=1Fn3mG9AT4dEPKR37nfVt6IdyIbukeWJr" 
          target="_blank" 
          rel="noopener noreferrer"
          className="inline-flex items-center"
        >
          <Button 
            className="bg-[#a4c639] hover:bg-[#8baa30] text-white rounded-full h-8 px-3 flex items-center justify-center shadow-md hover:shadow-lg transition-all gap-1 text-xs"
            size="sm"
          >
            <img 
              src="/lovable-uploads/4a08308d-0a6d-4114-b820-f511ce7d7a65.png" 
              alt="Android App" 
              className="h-5 w-5"
            />
            <span>Für Android herunterladen</span>
          </Button>
        </a>
      </div>
      <div className="flex-1 flex justify-end">
        <button 
          onClick={() => setIsVisible(false)} 
          className="text-white rounded-full p-1 hover:bg-white/20 transition-colors"
          aria-label="Schließen"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

export default BetaTesterBanner;
