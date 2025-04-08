
import React, { useEffect, useState } from 'react';
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
  console.log(`LiveTickerWrapper: Passing ${events.length} events to LiveTicker`);
  return <LiveTicker events={events} />;
};

const Index = () => {
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);
  
  const [testModalOpen, setTestModalOpen] = useState(false);
  const WHATSAPP_URL = "https://chat.whatsapp.com/C13SQuimtp0JHtx5x87uxK";
  
  return (
    <div className="min-h-screen flex flex-col bg-[#FFF5EB] dark:bg-[#2E1E12] text-orange-900 dark:text-orange-100">
      <CalendarNavbar />
      <main className="flex-grow relative">
        {/* Hero Section - adjusted height for better spacing */}
        <div className="relative w-full h-[65vh] overflow-hidden bg-black">
          <img 
            src="/lovable-uploads/e3d0a85b-9935-450a-bba8-5693570597a3.png" 
            alt="Freunde genießen ein Event zusammen" 
            className="absolute inset-0 w-full h-full object-cover opacity-90"
          />
          
          <div className="absolute inset-0 bg-gradient-to-r from-red-900/70 to-black/70"></div>
          
          <div className="relative z-10 h-full flex flex-col items-center justify-center text-white px-4 pt-6">
            <h1 className="text-5xl md:text-6xl font-bold mb-4 text-center font-serif mt-4 animate-fade-in">
              Entdecke den <span className="text-red-500">Puls</span> der Stadt
            </h1>
            
            <p className="text-xl md:text-2xl text-center max-w-2xl mb-6 animate-fade-in" 
               style={{ animationDelay: "0.1s" }}>
              Verbinde dich mit Events und Menschen aus deiner Stadt #Liebefeld
              <span className="inline-block ml-1 animate-pulse text-red-500">❤</span>
            </p>
            
            <div className="flex flex-col items-center justify-center gap-3 w-full max-w-xl mb-12 relative z-30 animate-fade-in" 
                 style={{ animationDelay: "0.2s" }}>
              <Button 
                onClick={() => setTestModalOpen(true)}
                className="bg-green-600 hover:bg-green-700 text-white flex items-center gap-2 rounded-full px-4 py-2 text-sm transition-all shadow-lg hover:shadow-xl w-full max-w-sm"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24" className="w-5 h-5">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                WhatsApp Community beitreten
              </Button>
              
              <CommunityTest 
                open={testModalOpen}
                onOpenChange={setTestModalOpen}
                whatsappUrl={WHATSAPP_URL}
              />
              
              <div className="flex items-center justify-center gap-3 mt-2">
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
            </div>
            
            {/* Live Ticker moved here - after the icons/buttons but still inside the hero section */}
            <div className="w-full bg-black/80 backdrop-blur-sm rounded-lg mb-4 max-w-3xl">
              <EventProvider>
                <LiveTickerWrapper />
              </EventProvider>
            </div>
          </div>
        </div>
        
        {/* Remove the LiveTicker section that was here before */}
        <EventProvider>
          {/* Calendar Section */}
          <div className="bg-[#F1F0FB] dark:bg-[#3A2A1E] py-6 rounded-t-lg shadow-inner">
            <EventCalendar defaultView="list" />
          </div>
          
          <EventChatBot />
        </EventProvider>
      </main>
    </div>
  );
};

export default Index;
