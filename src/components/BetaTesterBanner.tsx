
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { X, Mail, Download } from 'lucide-react';

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
    <div 
      className={`w-full bg-gradient-to-r from-red-800 to-red-600 text-white py-2 px-4 flex items-center justify-between transition-all duration-700 ${isFlashing ? 'bg-opacity-100' : 'bg-opacity-80'}`}
      style={{
        animation: 'gradient-shift 2s ease-in-out infinite alternate',
        boxShadow: '0 2px 15px rgba(220, 38, 38, 0.3)'
      }}
    >
      <div className="flex items-center">
        <a 
          href="mailto:Maik.z@gmx.de"
          className="text-white/90 hover:text-white flex items-center gap-1 text-xs sm:text-sm transition-colors"
        >
          <Mail className="h-3 w-3 sm:h-4 sm:w-4" />
          <span>Feedback: Maik.z@gmx.de</span>
        </a>
      </div>
      
      <div className="flex items-center justify-center flex-grow">
        <span className="mr-2 font-medium text-sm sm:text-base animate-pulse-soft whitespace-nowrap">Werde Beta Tester unserer App</span>
        <a 
          href="https://drive.google.com/uc?export=download&id=1Fn3mG9AT4dEPKR37nfVt6IdyIbukeWJr" 
          target="_blank" 
          rel="noopener noreferrer"
          className="inline-flex items-center"
        >
          <Button 
            className="bg-[#F97316] hover:bg-[#ea580c] text-white rounded-full h-9 px-4 flex items-center justify-center shadow-lg hover:shadow-xl transition-all gap-1.5 text-xs sm:text-sm scale-105 relative overflow-hidden border-2 border-white/40"
            size="sm"
          >
            <span className="absolute inset-0 bg-white/20 opacity-0 hover:opacity-100 transition-opacity"></span>
            <img 
              src="/lovable-uploads/4a08308d-0a6d-4114-b820-f511ce7d7a65.png" 
              alt="Android App" 
              className="h-5 w-5 animate-pulse-soft"
            />
            <span className="hidden sm:inline font-bold">Für Android herunterladen</span>
            <span className="sm:hidden font-bold">Download</span>
            <Download className="h-4 w-4 animate-bounce-slow" />
          </Button>
        </a>
      </div>
      
      <div className="flex justify-end">
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
