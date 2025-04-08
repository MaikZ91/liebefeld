
import React, { useEffect, useState, useRef } from 'react';
import EventCalendar, { Event } from '@/components/EventCalendar';
import CalendarNavbar from '@/components/CalendarNavbar';
import LiveTicker from '@/components/LiveTicker';
import EventChatBot from '@/components/EventChatBot';
import InstagramFeed from '@/components/InstagramFeed';
import CommunityTest from '@/components/CommunityTest';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { QrCode, WhatsApp } from 'lucide-react';
import { EventProvider, useEventContext } from '@/contexts/EventContext';
import { useToast } from '@/hooks/use-toast';

const LiveTickerWrapper = () => {
  const { events } = useEventContext();
  const tickerRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const timer = setTimeout(() => {
      if (tickerRef.current) {
        tickerRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        console.log('Scrolling to live ticker after animations completed');
      }
    }, 5000);
    
    return () => clearTimeout(timer);
  }, []);
  
  console.log(`LiveTickerWrapper: Passing ${events.length} events to LiveTicker`);
  return <LiveTicker events={events} tickerRef={tickerRef} />;
};

type AnimationType = 'char' | 'word' | 'whole';

const AnimatedText = ({ text, delay = 0, className = '', animationType = 'char' as AnimationType }: 
  { text: string; delay?: number; className?: string; animationType?: AnimationType }) => {
  
  if (animationType === 'whole') {
    return (
      <span 
        className={`relative inline-block ${className}`}
        style={{ 
          animationDelay: `${delay}s`,
          animation: 'text-appear 0.8s ease-out forwards',
          opacity: 0,
          transform: 'translateY(20px)'
        }}
      >
        {text}
      </span>
    );
  }
  
  if (animationType === 'word') {
    return (
      <span className={`relative inline-block ${className}`}>
        {text.split(' ').map((word, i) => (
          <span
            key={i}
            className="inline-block"
            style={{ 
              animationDelay: `${delay + i * 0.15}s`,
              animation: 'word-appear 0.8s ease-out forwards',
              opacity: 0,
              transform: 'translateY(20px)',
              marginRight: word === text.split(' ').slice(-1)[0] ? '0' : '0.3em'
            }}
          >
            {word}
          </span>
        ))}
      </span>
    );
  }
  
  return (
    <span className={`relative inline-block ${className}`}>
      {text.split('').map((char, i) => (
        <span
          key={i}
          className="inline-block"
          style={{ 
            animationDelay: `${delay + i * 0.05}s`,
            animation: 'char-appear 0.5s cubic-bezier(0.4, 0, 0.2, 1) forwards',
            opacity: 0,
            textShadow: char !== ' ' ? '0 0 8px rgba(255, 255, 255, 0.5)' : 'none'
          }}
        >
          {char === ' ' ? '\u00A0' : char}
        </span>
      ))}
    </span>
  );
};

const Index = () => {
  const [testModalOpen, setTestModalOpen] = useState(false);
  const [animationComplete, setAnimationComplete] = useState(false);
  const [showSubtitle, setShowSubtitle] = useState(true);
  const [titleAnimating, setTitleAnimating] = useState(true);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const WHATSAPP_URL = "https://chat.whatsapp.com/C13SQuimtp0JHtx5x87uxK";
  
  useEffect(() => {
    const textTimer = setTimeout(() => {
      setAnimationComplete(true);
      setTitleAnimating(false);
    }, 2500);
    
    return () => {
      clearTimeout(textTimer);
    };
  }, []);
  
  return (
    <div className="min-h-screen flex flex-col bg-[#FFF5EB] dark:bg-[#2E1E12] text-orange-900 dark:text-orange-100">
      <CalendarNavbar />
      <main className="flex-grow relative">
        <div className="relative w-full h-[55vh] overflow-hidden bg-black">
          <img 
            src="/lovable-uploads/e3d0a85b-9935-450a-bba8-5693570597a3.png" 
            alt="Freunde genießen ein Event zusammen" 
            className="absolute inset-0 w-full h-full object-cover"
            style={{
              animation: 'subtle-zoom 15s ease-in-out infinite alternate',
              animationDelay: '1s'
            }}
          />
          
          <div className="relative z-10 h-full flex flex-col items-center justify-center text-white px-4 pt-2">
            <div className="absolute left-5 top-2 flex items-center gap-2 z-20">
              <InstagramFeed />
              
              <a 
                href="https://drive.google.com/uc?export=download&id=1Fn3mG9AT4dEPKR37nfVt6IdyIbukeWJr" 
                target="_blank" 
                rel="noopener noreferrer"
                className="block"
              >
                <Button 
                  className="bg-[#a4c639] hover:bg-[#8baa30] text-white rounded-full h-10 w-10 p-0 flex items-center justify-center shadow-lg hover:shadow-xl transition-all"
                  size="icon"
                >
                  <img 
                    src="/lovable-uploads/4a08308d-0a6d-4114-b820-f511ce7d7a65.png" 
                    alt="Android App" 
                    className="h-7 w-7"
                  />
                </Button>
              </a>
              
              <Popover>
                <PopoverTrigger asChild>
                  <Button 
                    className="bg-[#F97316] hover:bg-orange-600 text-white rounded-full h-10 w-10 p-0 flex items-center justify-center shadow-lg hover:shadow-xl transition-all relative"
                    size="icon"
                  >
                    <QrCode className="h-5 w-5" />
                    <span className="absolute -top-1 -right-1 text-[8px] bg-white text-orange-700 rounded-full px-1 py-0.5 font-bold animate-pulse-soft">QR</span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-4">
                  <div className="flex flex-col items-center">
                    <div className="bg-white p-2 rounded-lg mb-2">
                      <img 
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=https://liebefeld.lovable.app/`}
                        alt="QR Code für Liebefeld App"
                        width={150}
                        height={150}
                      />
                    </div>
                    <p className="text-xs text-center">Besuche unsere Webseite</p>
                  </div>
                </PopoverContent>
              </Popover>
              
              {/* Simple WhatsApp Button */}
              <Button 
                className="bg-[#25D366] hover:bg-[#128C7E] text-white rounded-full h-10 px-3 flex items-center justify-center shadow-lg hover:shadow-xl transition-all gap-1"
                onClick={() => setTestModalOpen(true)}
              >
                <WhatsApp className="h-5 w-5" />
                <span className="text-xs font-medium">Community</span>
              </Button>
            </div>

            <div className="transition-opacity duration-500 ease-in-out mt-0 -translate-y-10">
              <h1 className="text-5xl md:text-6xl font-bold mb-3 text-center font-serif mt-2">
                {titleAnimating ? (
                  <>
                    <AnimatedText text="Entdecke den " delay={0.5} animationType="word" />
                    <AnimatedText text="Puls" delay={1.2} className="text-red-500 font-bold" animationType="char" />
                    <AnimatedText text=" der Stadt" delay={1.7} animationType="word" />
                  </>
                ) : (
                  <span className="relative">
                    Entdecke den <span className="text-red-500 relative inline-block">
                      Puls
                    </span> der Stadt
                  </span>
                )}
              </h1>
              
              {showSubtitle && (
                <p 
                  className="text-xl md:text-2xl text-center max-w-2xl mb-4 transition-all duration-700" 
                  style={{ 
                    opacity: animationComplete ? 1 : 0, 
                    transform: animationComplete ? 'translateY(0)' : 'translateY(20px)'
                  }}
                >
                  Verbinde dich mit Events und Menschen aus deiner Stadt #Liebefeld
                </p>
              )}
            </div>
            
            <div className="w-full bg-black/80 backdrop-blur-sm mb-0 absolute bottom-0 left-0">
              <EventProvider>
                <LiveTickerWrapper />
              </EventProvider>
            </div>
          </div>
        </div>
        
        <EventProvider>
          <div className="bg-[#F1F0FB] dark:bg-[#3A2A1E] py-3 rounded-t-lg shadow-inner">
            <EventCalendar defaultView="list" />
          </div>
          
          <EventChatBot />
        </EventProvider>
      </main>

      <CommunityTest 
        open={testModalOpen} 
        onOpenChange={setTestModalOpen} 
        whatsappUrl={WHATSAPP_URL} 
      />
    </div>
  );
};

export default Index;
