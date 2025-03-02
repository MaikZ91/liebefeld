
import React, { useEffect } from 'react';
import EventCalendar from '@/components/EventCalendar';
import CalendarNavbar from '@/components/CalendarNavbar';

const Index = () => {
  // Add smooth scroll-in animation effect on page load
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);
  
  return (
    <div className="min-h-screen flex flex-col bg-[#FFF5EB] dark:bg-[#2E1E12] text-orange-900 dark:text-orange-100">
      <CalendarNavbar />
      <main className="flex-grow">
        {/* Video Banner Section */}
        <div className="relative w-full h-[50vh] overflow-hidden">
          {/* Video background */}
          <video 
            className="absolute inset-0 w-full h-full object-cover"
            autoPlay
            muted
            loop
            playsInline
          >
            <source src="https://cdn.gpteng.co/file/g-demo-assets/city-life.mp4" type="video/mp4" />
            Your browser does not support the video tag.
          </video>
          
          {/* Overlay with red gradient */}
          <div className="absolute inset-0 bg-gradient-to-r from-red-900/70 to-black/70"></div>
          
          {/* Content */}
          <div className="relative z-10 h-full flex flex-col items-center justify-center text-white px-4">
            <h1 className="text-5xl md:text-6xl font-bold mb-4 text-center font-serif">Entdecke den Puls der Stadt</h1>
            <p className="text-xl md:text-2xl text-center max-w-2xl">
              Konzerte, Parties, Ausstellungen und mehr in Liebefeld
            </p>
          </div>
        </div>

        {/* Community Calendar Title Section */}
        <div className="relative overflow-hidden mb-6 bg-black">
          <div className="absolute inset-0 bg-gradient-to-r from-orange-500/20 to-red-500/20 z-0"></div>
          <div className="container mx-auto px-4 py-12 relative z-10">
            <h1 className="text-4xl md:text-5xl font-bold text-center mb-2 text-orange-500 dark:text-orange-400">Liebefeld Community Kalender</h1>
            <p className="text-lg md:text-xl text-center text-orange-400 dark:text-orange-300 max-w-2xl mx-auto">
              Entdecke Konzerte, Parties, Ausstellungen und Sportveranstaltungen in Bielefeld
            </p>
          </div>
        </div>

        {/* Updated the background color to a soft gray for better text contrast */}
        <div className="bg-[#F1F0FB] dark:bg-[#3A2A1E] py-6 rounded-t-lg shadow-inner">
          <EventCalendar defaultView="list" />
        </div>
      </main>
    </div>
  );
};

export default Index;
