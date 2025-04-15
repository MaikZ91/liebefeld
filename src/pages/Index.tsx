import React, { useEffect, useState, useRef } from 'react';
import CalendarNavbar from '@/components/CalendarNavbar';
import LiveTicker from '@/components/LiveTicker';
import EventChatBot from '@/components/EventChatBot';
import InstagramFeed from '@/components/InstagramFeed';
import CommunityTest from '@/components/CommunityTest';
import CalendarWithChat from '@/components/CalendarWithChat';
import BetaTesterBanner from '@/components/BetaTesterBanner';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { QrCode } from 'lucide-react';
import { EventProvider, useEventContext } from '@/contexts/EventContext';
import { Badge, PartyPopper, Brush, Dumbbell, Hash } from 'lucide-react';

const LiveTickerWrapper = () => {
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
  
  return (
    <EventProvider>
      <EventProviderConsumer tickerRef={tickerRef} />
    </EventProvider>
  );
};

const EventProviderConsumer = ({ tickerRef }: { tickerRef: React.RefObject<HTMLDivElement> }) => {
  const { events } = useEventContext();
  console.log(`EventProviderConsumer: Passing ${events.length} events to LiveTicker`);
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
  const WHATSAPP_URL = "https://chat.whatsapp.com/C13SQuimtp0JHtx5x87uxK";
  
  useEffect(() => {
    const textTimer = setTimeout(() => {
      setAnimationComplete(true);
      setTitleAnimating(false);
    }, 2500);
    
    const setupCommunityTestButton = () => {
      const button = document.getElementById('community-test');
      if (button) {
        button.addEventListener('click', () => setTestModalOpen(true));
      }
    };
    
    setupCommunityTestButton();
    const buttonSetupTimer = setTimeout(setupCommunityTestButton, 1000);
    
    return () => {
      clearTimeout(textTimer);
      clearTimeout(buttonSetupTimer);
    };
  }, []);
  
  return (
    <div className="min-h-screen flex flex-col bg-black text-white">
      <CalendarNavbar />
      <BetaTesterBanner />
      <main className="flex-grow relative">
        <div className="relative w-full h-[50vh] overflow-hidden bg-black">
          <img 
            src="/lovable-uploads/e3d0a85b-9935-450a-bba8-5693570597a3.png" 
            alt="Freunde genießen ein Event zusammen" 
            className="absolute inset-0 w-full h-full object-cover opacity-70"
            style={{
              animation: 'subtle-zoom 15s ease-in-out infinite alternate',
              animationDelay: '1s'
            }}
          />
          
          <div className="relative z-10 h-full flex flex-col items-center justify-center text-white px-4 pt-2">
            <div className="absolute left-3 top-3 flex items-center gap-1 z-20">
              <InstagramFeed />
              
              <a 
                href="https://drive.google.com/uc?export=download&id=1Fn3mG9AT4dEPKR37nfVt6IdyIbukeWJr" 
                target="_blank" 
                rel="noopener noreferrer"
                className="block"
              >
                <Button 
                  className="bg-[#a4c639] hover:bg-[#8baa30] text-white rounded-full h-8 w-8 p-0 flex items-center justify-center shadow-lg hover:shadow-xl transition-all"
                  size="icon"
                >
                  <img 
                    src="/lovable-uploads/4a08308d-0a6d-4114-b820-f511ce7d7a65.png" 
                    alt="Android App" 
                    className="h-5 w-5"
                  />
                </Button>
              </a>
              
              <Popover>
                <PopoverTrigger asChild>
                  <Button 
                    className="bg-[#F97316] hover:bg-orange-600 text-white rounded-full h-8 w-8 p-0 flex items-center justify-center shadow-lg hover:shadow-xl transition-all relative"
                    size="icon"
                  >
                    <QrCode className="h-4 w-4" />
                    <span className="absolute -top-1 -right-1 text-[7px] bg-white text-orange-700 rounded-full px-0.5 py-0 font-bold animate-pulse-soft">QR</span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-3">
                  <div className="flex flex-col items-center">
                    <div className="bg-white p-1 rounded-lg mb-1">
                      <img 
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=https://liebefeld.lovable.app/`}
                        alt="QR Code für Liebefeld App"
                        width={120}
                        height={120}
                      />
                    </div>
                    <p className="text-xs text-center">Besuche unsere Webseite</p>
                  </div>
                </PopoverContent>
              </Popover>
            </div>

            <div className="transition-opacity duration-500 ease-in-out mt-12 flex flex-col items-center">
              <h1 className="text-4xl md:text-5xl font-bold mb-2 text-center font-serif">
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
                  className="text-lg md:text-xl text-center max-w-xl mb-6 transition-all duration-700" 
                  style={{ 
                    opacity: animationComplete ? 1 : 0, 
                    transform: animationComplete ? 'translateY(0)' : 'translateY(20px)'
                  }}
                >
                  Verbinde dich mit Events und Menschen aus deiner Stadt #Liebefeld
                </p>
              )}
              
              <div className="w-full max-w-md bg-gradient-to-br from-[#128C7E]/80 to-black/80 backdrop-blur-sm rounded-xl p-4 mb-6 shadow-lg border border-white/10">
                <h2 className="text-xl font-bold mb-2">Lust auf coole Leute & gute Vibes?</h2>
                <p className="mb-3 text-white/90 text-sm">Dann join unsere Community:</p>
                
                <div className="flex flex-wrap justify-center gap-3 mb-4">
                  <div className="flex items-center bg-[#FF5722]/20 backdrop-blur-md rounded-full px-3 py-1.5 border border-[#FF5722]/30 shadow-sm animate-pulse-soft hover:bg-[#FF5722]/30 transition-colors cursor-pointer">
                    <Hash size={16} className="mr-1 text-[#FF5722]" />
                    <span className="text-white font-medium">ausgehen</span>
                  </div>
                  
                  <div className="flex items-center bg-[#9C27B0]/20 backdrop-blur-md rounded-full px-3 py-1.5 border border-[#9C27B0]/30 shadow-sm animate-pulse-soft hover:bg-[#9C27B0]/30 transition-colors cursor-pointer">
                    <Hash size={16} className="mr-1 text-[#9C27B0]" />
                    <span className="text-white font-medium">kreativität</span>
                  </div>
                  
                  <div className="flex items-center bg-[#2196F3]/20 backdrop-blur-md rounded-full px-3 py-1.5 border border-[#2196F3]/30 shadow-sm animate-pulse-soft hover:bg-[#2196F3]/30 transition-colors cursor-pointer">
                    <Hash size={16} className="mr-1 text-[#2196F3]" />
                    <span className="text-white font-medium">sport</span>
                  </div>
                </div>
                
                <p className="mb-3 text-white/90 text-sm font-medium">
                  Jetzt dabei sein & gemeinsam planen!
                </p>
                
                <Button 
                  onClick={() => setTestModalOpen(true)}
                  className="w-full bg-[#25D366] hover:bg-[#128C7E] text-white shadow-md"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="white" className="h-5 w-5 mr-2">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                  WhatsApp Community beitreten
                </Button>
                
                <div className="mt-2 text-xs text-white/70 text-center">
                  <span className="inline-block animate-pulse-slow">🌱</span> Die App ist im Aufbau. Werde Teil der Community und helfe mit!
                </div>
              </div>
            </div>
            
            <div className="w-full bg-black/80 backdrop-blur-sm absolute bottom-0 left-0">
              <LiveTickerWrapper />
            </div>
          </div>
        </div>
        
        <div className="bg-black py-2 rounded-t-lg shadow-inner">
          <div className="container mx-auto px-3 py-3">
            <div className="mb-4 text-center">
              <h2 className="text-xl font-bold mb-1 font-serif">Kalender & Community</h2>
              <p className="text-gray-400 text-sm">Entdecke Events und tausche dich mit der Community aus</p>
            </div>
          
            <EventProvider>
              <CalendarWithChat defaultView="list" />
            </EventProvider>
          </div>
        </div>
          
        <EventChatBot />
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
