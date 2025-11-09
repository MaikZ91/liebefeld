// src/pages/Index.tsx
import React, { useEffect, useState, useRef } from 'react';
import CalendarNavbar from '@/components/CalendarNavbar';
import LiveTicker from '@/components/LiveTicker';
import InstagramFeed from '@/components/InstagramFeed';
import CommunityTest from '@/components/CommunityTest';
import ImageCarousel from '@/components/ImageCarousel';
import BetaTesterBanner from '@/components/BetaTesterBanner';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { QrCode } from 'lucide-react';
import { useEventContext } from '@/contexts/EventContext'; // Import useEventContext

type AnimationType = 'char' | 'word' | 'whole';

const AnimatedText = ({ text, delay = 0, className = '', animationType = 'whole' as AnimationType }: 
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
  const chatbotRef = useRef<any>(null);
  
  // Community images for carousel
  const communityImages = [
    {
      src: "/lovable-uploads/e3d0a85b-9935-450a-bba8-5693570597a3.png",
      alt: "Freunde genießen ein Event zusammen"
    },
    {
      src: "/lovable-uploads/8413f0b2-fdba-4473-a257-bb471b29ea95.png", 
      alt: "Community Event in Bielefeld"
    },
    {
      src: "/lovable-uploads/764c9b33-5d7d-4134-b503-c77e23c469f9.png",
      alt: "Lebendige Stadtgemeinschaft"
    }
  ];
  
  useEffect(() => {
    const textTimer = setTimeout(() => {
      setAnimationComplete(true);
      setTitleAnimating(false);
    }, 2500);
    
    if (typeof window !== 'undefined') {
      chatbotRef.current = (window as any).chatbotQuery;
    }
    
    return () => {
      clearTimeout(textTimer);
    };
  }, []);
  
  const handleChatbotQuery = (query: string) => {
    if (chatbotRef.current) {
      chatbotRef.current(query);
    }
  };
  
  // Hole Events, isLoading und selectedCity aus dem Kontext
  const { events, isLoading, selectedCity } = useEventContext(); 

  return (
    <div className="h-screen w-screen flex flex-col bg-black text-white overflow-hidden fixed inset-0 pb-20">
      {/* Header - Fixed height */}
      <div className="h-20 flex-shrink-0">
        <CalendarNavbar />
        <BetaTesterBanner />
      </div>
      
      {/* LiveTicker - Fixed position with highest z-index */}
      <div className="fixed top-20 left-0 right-0 h-12 w-full bg-black/95 backdrop-blur-lg border-b border-white/20 shadow-xl z-50 flex-shrink-0">
        <LiveTicker events={events} isLoadingEvents={isLoading} selectedCity={selectedCity} /> {/* selectedCity als Prop übergeben */}
      </div>
      
      {/* Main content - Fixed calculated height with top padding for ticker */}
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden" style={{ height: 'calc(100vh - 80px)', paddingTop: '48px' }}>
        {/* Hero Section - Fixed half height */}
        <div className="h-1/2 relative bg-gradient-to-br from-gray-900 via-black to-purple-900/80 overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-purple-900/30 via-black/60 to-black opacity-90"></div>
          
          {/* Premium particle effect overlay */}
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-10 left-10 w-2 h-2 bg-white rounded-full animate-pulse"></div>
            <div className="absolute top-32 right-20 w-1 h-1 bg-purple-400 rounded-full animate-ping"></div>
            <div className="absolute bottom-20 left-32 w-1.5 h-1.5 bg-red-400 rounded-full animate-pulse"></div>
            <div className="absolute top-40 left-1/3 w-1 h-1 bg-blue-400 rounded-full animate-ping delay-300"></div>
            <div className="absolute bottom-32 right-1/4 w-2 h-2 bg-white/60 rounded-full animate-pulse delay-700"></div>
          </div>
          
          <div className="relative z-10 h-full flex flex-col items-center justify-center text-white px-4">
            <div className="absolute left-4 top-4 flex items-center gap-3 z-20">
              <InstagramFeed />
              
              <a 
                href="https://drive.google.com/uc?export=download&id=1Fn3mG9AT4dEPKR37nfVt6IdyIbukeWJr" 
                target="_blank" 
                rel="noopener noreferrer"
                className="block group"
              >
                <Button 
                  className="bg-gradient-to-r from-[#a4c639] to-[#8baa30] hover:from-[#8baa30] hover:to-[#76951a] text-white rounded-full h-10 w-10 p-0 flex items-center justify-center shadow-2xl hover:shadow-3xl transition-all hover:scale-110 border-2 border-white/30 backdrop-blur-sm group-hover:rotate-6"
                  size="icon"
                >
                  <img 
                    src="/lovable-uploads/4a08308d-0a6d-4114-b820-f511ce7d7a65.png" 
                    alt="Android App" 
                    className="h-6 w-6 group-hover:scale-110 transition-transform"
                  />
                </Button>
              </a>
              
              <Popover>
                <PopoverTrigger asChild>
                  <Button 
                    className="bg-gradient-to-r from-[#F97316] to-[#ea580c] hover:from-[#ea580c] hover:to-[#dc2626] text-white rounded-full h-10 w-10 p-0 flex items-center justify-center shadow-2xl hover:shadow-3xl transition-all hover:scale-110 relative border-2 border-white/30 backdrop-blur-sm group"
                    size="icon"
                  >
                    <QrCode className="h-5 w-5 group-hover:rotate-12 transition-transform" />
                    <span className="absolute -top-1 -right-1 text-[8px] bg-white text-orange-700 rounded-full px-1.5 py-0.5 font-bold animate-bounce">QR</span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-4 bg-white/98 backdrop-blur-md border-2 border-gray-200/50 shadow-2xl rounded-2xl">
                  <div className="flex flex-col items-center">
                    <div className="bg-white p-2 rounded-xl mb-2 shadow-lg border border-gray-100">
                      <img 
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=https://liebefeld.lovable.app/`}
                        alt="QR Code für Liebefeld App"
                        width={120}
                        height={120}
                        className="rounded-lg"
                      />
                    </div>
                    <p className="text-xs text-center font-semibold text-gray-800">Besuche unsere Webseite</p>
                  </div>
                </PopoverContent>
              </Popover>
            </div>

            <div className="transition-opacity duration-700 ease-in-out flex flex-col items-center max-w-4xl mx-auto">
              <h1 className="text-4xl md:text-5xl font-bold mb-4 text-center font-serif leading-tight tracking-wide">
                {titleAnimating ? (
                  <>
                    <AnimatedText text="Entdecke den " delay={0.5} animationType="word" />
                    <AnimatedText text="Puls" delay={1.2} className="text-red-500 font-bold" animationType="char" />
                    <AnimatedText text=" der Stadt" delay={1.7} animationType="word" />
                  </>
                ) : (
                  <span className="relative bg-gradient-to-r from-white via-gray-100 to-white bg-clip-text text-transparent">
                    Entdecke den <span className="text-red-500 relative inline-block drop-shadow-2xl">
                      Puls
                    </span> der Stadt
                  </span>
                )}
              </h1>
              
              {showSubtitle && (
                <p 
                  className="text-lg md:text-xl text-center max-w-2xl mb-6 transition-all duration-700 text-gray-100 leading-relaxed font-light tracking-wide" 
                  style={{ 
                    opacity: animationComplete ? 1 : 0, 
                    transform: animationComplete ? 'translateY(0)' : 'translateY(20px)'
                  }}
                >
                  Verbinde dich mit Events und Menschen aus deiner Stadt <span className="text-red-400 font-semibold">#Liebefeld</span>
                </p>
              )}
              
              <div className="flex gap-6">
                <Button 
                  onClick={() => setTestModalOpen(true)}
                  className="bg-gradient-to-r from-[#25D366] via-[#20C65A] to-[#128C7E] hover:from-[#128C7E] hover:to-[#0d5d56] text-white rounded-full px-8 py-6 flex items-center justify-center shadow-2xl hover:shadow-3xl transition-all gap-3 animate-bounce-slow border-3 border-white/40 backdrop-blur-sm text-lg font-bold tracking-wider group"
                  size="lg"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="white" className="h-6 w-6 group-hover:scale-110 transition-transform">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                  <span className="font-black tracking-wider">Community beitreten</span>
                </Button>
              </div>
            </div>
          </div>
        </div>
        
        {/* Bottom section - Fixed half height with internal overflow */}
        <div className="h-1/2 flex overflow-hidden">
          {/* Community Gallery - left side */}
          <div className="w-full bg-gradient-to-b from-gray-900 via-black to-gray-800 p-4 border-r border-gray-700/50 overflow-hidden">
            <div className="text-center mb-4">
              <h2 className="text-2xl md:text-3xl font-bold mb-2 font-serif bg-gradient-to-r from-white via-gray-200 to-white bg-clip-text text-transparent tracking-wide">
                Unsere Community
              </h2>
              <p className="text-gray-300 text-sm max-w-2xl mx-auto leading-relaxed font-light">
                Entdecke die lebendige Gemeinschaft
              </p>
            </div>
            
            <ImageCarousel 
              images={communityImages}
              className="w-full h-32"
              autoSlideInterval={10000}
            />
          </div>
        </div>
      </div>
      
      {/* Chat components with lower z-index to not interfere with ticker */}
      <div className="relative z-40">
        
      </div>

      <CommunityTest 
        open={testModalOpen} 
        onOpenChange={setTestModalOpen} 
        whatsappUrl={WHATSAPP_URL} 
      />
    </div>
  );
};

export default Index;
