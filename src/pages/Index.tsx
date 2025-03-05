
import React, { useEffect, useState } from 'react';
import EventCalendar, { Event } from '@/components/EventCalendar';
import CalendarNavbar from '@/components/CalendarNavbar';
import LiveTicker from '@/components/LiveTicker';
import EventChatBot from '@/components/EventChatBot';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';

const Index = () => {
  // Add smooth scroll-in animation effect on page load
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);
  
  // Get stored events for the live ticker
  const [events, setEvents] = useState<Event[]>([]);
  
  useEffect(() => {
    // First try to get events from Supabase
    const fetchEvents = async () => {
      try {
        const { data, error } = await supabase
          .from('community_events')
          .select('*')
          .order('date', { ascending: false });
        
        if (error) {
          console.error('Error fetching events from Supabase:', error);
          throw error;
        }
        
        if (data && data.length > 0) {
          console.log('Loaded events from Supabase:', data);
          setEvents(data as Event[]);
        } else {
          // Fallback to local storage if no events in Supabase
          const savedEvents = localStorage.getItem('communityEvents');
          if (savedEvents) {
            console.log('Loading events from localStorage as fallback');
            setEvents(JSON.parse(savedEvents));
          }
        }
      } catch (err) {
        console.error('Error in event fetching:', err);
        // Fallback to local storage
        const savedEvents = localStorage.getItem('communityEvents');
        if (savedEvents) {
          console.log('Loading events from localStorage due to error');
          setEvents(JSON.parse(savedEvents));
        }
      }
    };
    
    fetchEvents();
  }, []);
  
  console.log(`Index: Rendering with ${events.length} events for ticker`);
  
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
            <h1 className="text-5xl md:text-6xl font-bold mb-4 text-center font-serif flex items-center justify-center">
              Entdecke den 
              <span className="flex items-center mx-2">
                <span className="animate-pulse text-red-500">❤</span> Puls
              </span> 
              der Stadt
            </h1>
            <p className="text-xl md:text-2xl text-center max-w-2xl mb-6">
              Verbinde dich mit Events und Menschen aus deiner Stadt #Liebefeld
            </p>
            
            {/* WhatsApp Community Button */}
            <a 
              href="https://chat.whatsapp.com/C13SQuimtp0JHtx5x87uxK" 
              target="_blank" 
              rel="noopener noreferrer"
            >
              <Button 
                className="bg-green-600 hover:bg-green-700 text-white flex items-center gap-2 rounded-full px-6 py-2 transition-all shadow-lg hover:shadow-xl"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24" className="w-5 h-5">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                WhatsApp Community beitreten
              </Button>
            </a>
          </div>
        </div>
        
        {/* Live Ticker for all events */}
        <LiveTicker events={events} />

        {/* Updated the background color to a soft gray for better text contrast */}
        <div className="bg-[#F1F0FB] dark:bg-[#3A2A1E] py-6 rounded-t-lg shadow-inner mt-0">
          <EventCalendar defaultView="list" />
        </div>
        
        {/* Event Chat Bot */}
        <EventChatBot events={events} />
      </main>
    </div>
  );
};

export default Index;
