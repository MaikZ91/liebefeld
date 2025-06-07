
import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface Event {
  id: string;
  title: string;
  date: string;
  time: string;
  price?: string;
  location?: string;
  category?: string;
  image: string;
  description?: string;
}

interface EventSwiperProps {
  events: Event[];
  className?: string;
}

const EventSwiper: React.FC<EventSwiperProps> = ({ events, className }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  
  // Testbilder für Events
  const testImages = [
    'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=400&h=300&fit=crop'
  ];
  
  // Wenn keine Events vorhanden sind, Test-Events erstellen
  const displayEvents: Event[] = events.length > 0 ? events : [
    {
      id: '1',
      title: 'Geführter Altstadtrundgang Regensburg',
      date: '2025-06-07',
      time: '10:30',
      price: '12.00€',
      location: 'Regensburg Altstadt',
      category: 'Tourismus',
      image: testImages[0],
      description: 'Entdecken Sie die historische Altstadt von Regensburg bei einer geführten Tour.'
    },
    {
      id: '2',
      title: 'Konzert im Stadtpark',
      date: '2025-06-08',
      time: '19:00',
      price: '25.00€',
      location: 'Stadtpark Bühne',
      category: 'Musik',
      image: testImages[1],
      description: 'Live-Musik unter freiem Himmel mit regionalen Künstlern.'
    },
    {
      id: '3',
      title: 'Food Festival',
      date: '2025-06-09',
      time: '11:00',
      price: 'Kostenlos',
      location: 'Marktplatz',
      category: 'Kulinarik',
      image: testImages[2],
      description: 'Probieren Sie Spezialitäten aus der ganzen Welt.'
    },
    {
      id: '4',
      title: 'Kunstausstellung Modern Art',
      date: '2025-06-10',
      time: '14:00',
      price: '8.00€',
      location: 'Galerie Zentrum',
      category: 'Kunst',
      image: testImages[3],
      description: 'Moderne Kunstwerke zeitgenössischer Künstler.'
    },
    {
      id: '5',
      title: 'Sportfest im Park',
      date: '2025-06-11',
      time: '10:00',
      price: '5.00€',
      location: 'Volkspark',
      category: 'Sport',
      image: testImages[4],
      description: 'Mitmach-Aktionen und Sportwettkämpfe für alle Altersgruppen.'
    }
  ];
  
  const goToPrevious = () => {
    setCurrentIndex((prevIndex) => 
      prevIndex === 0 ? displayEvents.length - 1 : prevIndex - 1
    );
  };
  
  const goToNext = () => {
    setCurrentIndex((prevIndex) => 
      (prevIndex + 1) % displayEvents.length
    );
  };
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('de-DE', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };
  
  if (displayEvents.length === 0) {
    return (
      <div className="text-center text-gray-400 py-4">
        Keine Events verfügbar
      </div>
    );
  }
  
  const currentEvent = displayEvents[currentIndex];
  
  return (
    <div className={cn("bg-gradient-to-br from-red-500 to-red-700 rounded-xl p-4 text-white shadow-lg", className)}>
      <div className="text-center mb-4">
        <h3 className="text-lg font-medium opacity-90">EVENTS ENTDECKEN</h3>
      </div>
      
      <div className="relative bg-white rounded-lg overflow-hidden shadow-md">
        {/* Event Image */}
        <div className="relative">
          <img 
            src={currentEvent.image} 
            alt={currentEvent.title}
            className="w-full h-48 object-cover"
          />
          <div className="absolute top-2 right-2 bg-black/70 text-white px-2 py-1 rounded text-xs">
            🇩🇪
          </div>
        </div>
        
        {/* Event Details */}
        <div className="p-4 text-gray-800">
          <div className="flex items-start justify-between mb-2">
            <h4 className="font-semibold text-lg leading-tight flex-1">
              {currentEvent.title}
              <ExternalLink className="inline h-4 w-4 ml-1" />
            </h4>
          </div>
          
          <div className="space-y-2 text-sm">
            <p className="font-medium">
              Nächster Termin: {formatDate(currentEvent.date)} {currentEvent.time}
            </p>
            <p className="font-medium">
              Preis: {currentEvent.price}
            </p>
            {currentEvent.location && (
              <p className="text-gray-600">
                Ort: {currentEvent.location}
              </p>
            )}
            {currentEvent.category && (
              <p className="text-gray-600">
                Kategorie: {currentEvent.category}
              </p>
            )}
          </div>
        </div>
      </div>
      
      {/* Navigation */}
      <div className="flex items-center justify-between mt-4">
        <Button 
          onClick={goToPrevious}
          variant="ghost"
          size="icon"
          className="text-white hover:bg-white/20 rounded-full"
        >
          <ChevronLeft className="h-6 w-6" />
        </Button>
        
        {/* Dots Indicator */}
        <div className="flex space-x-2">
          {displayEvents.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={cn(
                "w-2 h-2 rounded-full transition-all",
                index === currentIndex 
                  ? "bg-white scale-125" 
                  : "bg-white/50"
              )}
            />
          ))}
        </div>
        
        <Button 
          onClick={goToNext}
          variant="ghost"
          size="icon"
          className="text-white hover:bg-white/20 rounded-full"
        >
          <ChevronRight className="h-6 w-6" />
        </Button>
      </div>
      
      {/* Event Description */}
      {currentEvent.description && (
        <div className="mt-4 text-white/90">
          <p className="text-sm leading-relaxed">
            {currentEvent.description}
          </p>
        </div>
      )}
      
      {/* Event Counter */}
      <div className="text-center mt-4">
        <p className="text-white/80 text-sm">
          Event {currentIndex + 1} von {displayEvents.length}
        </p>
      </div>
    </div>
  );
};

export default EventSwiper;
