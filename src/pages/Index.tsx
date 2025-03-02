
import React, { useEffect, useState } from 'react';
import EventCalendar, { Event } from '@/components/EventCalendar';
import CalendarNavbar from '@/components/CalendarNavbar';
import LiveTicker from '@/components/LiveTicker';

const Index = () => {
  // Add smooth scroll-in animation effect on page load
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);
  
  // Get stored events for the live ticker
  const [events, setEvents] = useState<Event[]>([]);
  
  useEffect(() => {
    const savedEvents = localStorage.getItem('communityEvents');
    if (savedEvents) {
      setEvents(JSON.parse(savedEvents));
    }
  }, []);
  
  return (
    <div className="min-h-screen flex flex-col bg-[#FFF5EB] dark:bg-[#2E1E12] text-orange-900 dark:text-orange-100">
      <CalendarNavbar />
      <main className="flex-grow">
        {/* Video Banner Section with Black Background */}
        <div className="relative w-full h-[50vh] overflow-hidden bg-black">
          {/* Video background */}
          <video 
            className="absolute inset-0 w-full h-full object-cover opacity-70"
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
        
        {/* Live Ticker for new events */}
        <LiveTicker events={events} />

        {/* Updated the background color to a soft gray for better text contrast */}
        <div className="bg-[#F1F0FB] dark:bg-[#3A2A1E] py-6 rounded-t-lg shadow-inner">
          <EventCalendar defaultView="list" />
        </div>
      </main>
    </div>
  );
};

export default Index;
