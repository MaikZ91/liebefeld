
import React, { useEffect } from 'react';
import EventCalendar from '@/components/EventCalendar';
import CalendarNavbar from '@/components/CalendarNavbar';

const Index = () => {
  // Add smooth scroll-in animation effect on page load
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);
  
  return (
    <div className="min-h-screen flex flex-col bg-[#131722] text-gray-200">
      <CalendarNavbar />
      <main className="flex-grow">
        <div className="relative overflow-hidden mb-6">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-900/30 to-indigo-900/30 z-0"></div>
          <div className="container mx-auto px-4 py-12 relative z-10">
            <h1 className="text-4xl md:text-5xl font-bold text-center mb-2 text-white">Liebefeld Community Kalender</h1>
            <p className="text-lg md:text-xl text-center text-gray-300 max-w-2xl mx-auto">
              Entdecke Konzerte, Parties, Ausstellungen und Sportveranstaltungen in Bielefeld. Lade Eventplakate hoch oder nutze deine Kamera, um Events mit automatischer OCR-Erkennung schnell hinzuzufügen!
            </p>
          </div>
        </div>
        <EventCalendar defaultView="list" />
      </main>
      <style jsx global>{`
        .custom-scrollbar {
          scrollbar-width: thin;
          scrollbar-color: rgba(255, 255, 255, 0.2) transparent;
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: rgba(255, 255, 255, 0.2);
          border-radius: 20px;
        }
      `}</style>
    </div>
  );
};

export default Index;
