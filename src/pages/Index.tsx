
import React, { useEffect, useState, useRef } from 'react';
import EventCalendar, { Event } from '@/components/EventCalendar';
import CalendarNavbar from '@/components/CalendarNavbar';
import LiveTicker from '@/components/LiveTicker';
import EventChatBot from '@/components/EventChatBot';
import InstagramFeed from '@/components/InstagramFeed';
import CommunityTest from '@/components/CommunityTest';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { QrCode } from 'lucide-react';
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
  const [showHeart, setShowHeart] = useState(false);
  const [heartAnimationComplete, setHeartAnimationComplete] = useState(false);
  const [showSubtitle, setShowSubtitle] = useState(true);
  const [titleAnimating, setTitleAnimating] = useState(true);
  const heartRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const WHATSAPP_URL = "https://chat.whatsapp.com/C13SQuimtp0JHtx5x87uxK";
  
  useEffect(() => {
    const textTimer = setTimeout(() => {
      setAnimationComplete(true);
      setTitleAnimating(false);
    }, 2500);
    
    const heartTimer = setTimeout(() => {
      setShowHeart(true);
    }, 3000);
    
    const heartAnimationTimer = setTimeout(() => {
      setHeartAnimationComplete(true);
    }, 4800);
    
    return () => {
      clearTimeout(textTimer);
      clearTimeout(heartTimer);
      clearTimeout(heartAnimationTimer);
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
            <div className="transition-opacity duration-500 ease-in-out">
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
            
            <div className="absolute left-5 top-5 flex items-center gap-3 z-20">
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
            </div>
            
            {showHeart && (
              <div 
                ref={heartRef}
                onClick={() => setTestModalOpen(true)}
                className={`absolute z-20 flex items-center justify-center cursor-pointer transition-all duration-1000`}
                style={{ 
                  top: '80%', // Moved down from 70% to 80% to avoid overlapping with subtitle
                  left: '50%',
                  width: '140px',
                  height: '140px',
                  marginLeft: '-70px',
                  marginTop: '-70px',
                  filter: 'drop-shadow(0 0 15px rgba(220, 38, 38, 0.8))',
                  transform: heartAnimationComplete ? 'scale(0.8)' : 'scale(1)',
                  animation: !heartAnimationComplete ? 'heart-entrance 1s cubic-bezier(0.17, 0.67, 0.83, 0.67) forwards, heart-beat 1.5s ease-in-out infinite' : 'heart-beat 1.5s ease-in-out infinite',
                  opacity: heartAnimationComplete ? 1 : 0
                }}
              >
                <div className="relative w-full h-full flex items-center justify-center">
                  <svg 
                    viewBox="0 0 24 24" 
                    fill="#e11d48" 
                    className="w-32 h-32"
                    style={{
                      filter: 'drop-shadow(0 0 5px rgba(255, 0, 0, 0.7))'
                    }}
                  >
                    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                    <div className="text-white text-xs px-1 mb-1 max-w-[90px]">
                      Hier gehts zu unserer Community
                    </div>
                    <svg 
                      viewBox="0 0 24 24" 
                      fill="white" 
                      className="w-6 h-6"
                    >
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                    </svg>
                  </div>
                </div>
              </div>
            )}
            
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
    </div>
  );
};

export default Index;
