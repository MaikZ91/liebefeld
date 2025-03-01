
import React from 'react';
import { type Event } from './EventCalendar';
import { Music, PartyPopper, Image, Dumbbell, Calendar, Clock, MapPin, Users, Landmark } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

interface EventCardProps {
  event: Event;
  onClick?: () => void;
  className?: string;
  compact?: boolean;
}

const categoryColors: Record<string, string> = {
  'Konzert': 'bg-blue-900/60 text-blue-100 dark:bg-blue-900/60 dark:text-blue-100',
  'Party': 'bg-pink-900/60 text-pink-100 dark:bg-pink-900/60 dark:text-pink-100',
  'Ausstellung': 'bg-purple-900/60 text-purple-100 dark:bg-purple-900/60 dark:text-purple-100',
  'Sport': 'bg-green-900/60 text-green-100 dark:bg-green-900/60 dark:text-green-100',
  'Workshop': 'bg-yellow-900/60 text-yellow-100 dark:bg-yellow-900/60 dark:text-yellow-100',
  'Kultur': 'bg-indigo-900/60 text-indigo-100 dark:bg-indigo-900/60 dark:text-indigo-100',
  'Sonstiges': 'bg-gray-800/60 text-gray-200 dark:bg-gray-800/60 dark:text-gray-200',
  'Networking': 'bg-blue-900/60 text-blue-100 dark:bg-blue-900/60 dark:text-blue-100',
  'Meeting': 'bg-gray-800/60 text-gray-200 dark:bg-gray-800/60 dark:text-gray-200',
};

const categoryIcons: Record<string, React.ReactNode> = {
  'Konzert': <Music className="w-4 h-4" />,
  'Party': <PartyPopper className="w-4 h-4" />,
  'Ausstellung': <Image className="w-4 h-4" />,
  'Sport': <Dumbbell className="w-4 h-4" />,
  'Workshop': <Users className="w-4 h-4" />,
  'Kultur': <Landmark className="w-4 h-4" />,
  'Sonstiges': <Calendar className="w-4 h-4" />,
  'Networking': <Users className="w-4 h-4" />,
  'Meeting': <Users className="w-4 h-4" />,
};

const EventCard: React.FC<EventCardProps> = ({ event, onClick, className, compact = false }) => {
  const icon = event.category in categoryIcons 
    ? categoryIcons[event.category] 
    : <Calendar className="w-4 h-4" />;

  if (compact) {
    return (
      <div 
        className={cn(
          "dark-glass-card rounded-lg p-3 cursor-pointer hover-scale mb-2",
          className
        )}
        onClick={onClick}
      >
        <div className="flex justify-between items-center">
          <h4 className="font-medium text-sm text-white truncate mr-2">{event.title}</h4>
          <Badge className={cn(
            "flex items-center gap-1 text-xs font-medium",
            event.category in categoryColors 
              ? categoryColors[event.category] 
              : "bg-gray-800/60 text-gray-200"
          )}>
            {icon}
          </Badge>
        </div>
        
        <div className="flex items-center justify-between mt-1.5 text-xs text-gray-300">
          <div className="flex items-center">
            <Clock className="w-3 h-3 mr-1" />
            <span>{event.time} Uhr</span>
          </div>
          
          <div className="flex items-center">
            <MapPin className="w-3 h-3 mr-1" />
            <span className="truncate max-w-[140px]">{event.location}</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      className={cn(
        "dark-glass-card rounded-xl p-4 cursor-pointer hover-scale",
        className
      )}
      onClick={onClick}
    >
      <div className="flex justify-between items-start mb-2">
        <h4 className="font-medium text-lg text-white">{event.title}</h4>
        <Badge className={cn(
          "flex items-center gap-1 text-xs font-medium",
          event.category in categoryColors 
            ? categoryColors[event.category] 
            : "bg-gray-800/60 text-gray-200"
        )}>
          {icon}
          {event.category}
        </Badge>
      </div>
      
      <div className="space-y-2 text-sm text-gray-300">
        <div className="flex items-center">
          <Clock className="w-4 h-4 mr-2" />
          <span>{event.time} Uhr</span>
        </div>
        
        <div className="flex items-center">
          <MapPin className="w-4 h-4 mr-2" />
          <span className="truncate">{event.location}</span>
        </div>
      </div>
    </div>
  );
};

export default EventCard;
