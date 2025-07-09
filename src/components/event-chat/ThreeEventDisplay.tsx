import React from 'react';
import { Button } from '@/components/ui/button';
import { Users, ChevronUp } from 'lucide-react';
import { PanelEventData, PanelEvent } from './types';
import { cn } from '@/lib/utils';

interface ThreeEventDisplayProps {
  panelData: PanelEventData;
  onEventSelect?: (eventId: string) => void;
  className?: string;
}

const ThreeEventDisplay: React.FC<ThreeEventDisplayProps> = ({
  panelData,
  onEventSelect,
  className
}) => {
  // Get first 3 events
  const displayEvents = panelData.events.slice(0, 3);
  const totalEvents = panelData.events.length;

  const handleEventClick = (event: PanelEvent) => {
    if ('id' in event && onEventSelect) {
      onEventSelect(event.id);
    }
  };

  if (displayEvents.length === 0) return null;

  return (
    <div className={cn("w-full space-y-4", className)}>
      {/* AI Recommendations Header */}
      <div className="text-center">
        <div className="bg-black text-white px-8 py-3 rounded-full inline-block font-semibold text-lg">
          AI Recommendations
        </div>
      </div>

      {/* Three Event Cards */}
      <div className="flex gap-4 px-4">
        {displayEvents.map((event, index) => {
          const imageUrl = 'image_url' in event ? event.image_url : '/placeholder-event.jpg';
          
          return (
            <div 
              key={index}
              className="flex-1 bg-black rounded-2xl overflow-hidden cursor-pointer transform transition-transform hover:scale-105"
              onClick={() => handleEventClick(event as PanelEvent)}
            >
              {/* Event Image */}
              <div className="relative h-48 overflow-hidden">
                <img
                  src={imageUrl}
                  alt={event.title}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.src = 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=400&h=300&fit=crop';
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                
                {/* Event Details */}
                <div className="absolute bottom-0 left-0 right-0 p-4">
                  <h3 className="text-white font-bold text-lg mb-2 line-clamp-2">
                    {event.title}
                  </h3>
                  <div className="text-gray-300 text-sm space-y-1">
                    <div>{event.date}</div>
                    {'time' in event && event.time && (
                      <div>{event.time}</div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Find YOUR Tribe Button */}
      <div className="text-center px-4">
        <Button className="bg-black text-red-500 hover:bg-gray-900 px-8 py-3 rounded-full font-bold text-lg border-2 border-red-500/30">
          <Users className="w-5 h-5 mr-2" />
          Find YOUR Tribe
        </Button>
      </div>

      {/* Events Counter with Arrow */}
      {totalEvents > 3 && (
        <div className="flex items-center justify-between px-4 py-2">
          <span className="text-white font-semibold text-lg">
            {totalEvents} Events
          </span>
          <ChevronUp className="w-6 h-6 text-white" />
        </div>
      )}
    </div>
  );
};

export default ThreeEventDisplay;