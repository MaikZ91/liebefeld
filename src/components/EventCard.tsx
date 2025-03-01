
import React from 'react';
import { type Event } from './EventCalendar';
import { Music, PartyPopper, Image, Dumbbell, Calendar, Clock, MapPin, Users, Landmark } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

interface EventCardProps {
  event: Event;
  onClick?: () => void;
  className?: string;
}

const categoryColors: Record<string, string> = {
  'Konzert': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
  'Party': 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-300',
  'Ausstellung': 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
  'Sport': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  'Workshop': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
  'Kultur': 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300',
  'Sonstiges': 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
  'Networking': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
  'Meeting': 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
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

const EventCard: React.FC<EventCardProps> = ({ event, onClick, className }) => {
  const icon = event.category in categoryIcons 
    ? categoryIcons[event.category] 
    : <Calendar className="w-4 h-4" />;

  return (
    <div 
      className={cn(
        "glass-card rounded-xl p-4 cursor-pointer hover-scale",
        className
      )}
      onClick={onClick}
    >
      <div className="flex justify-between items-start mb-2">
        <h4 className="font-medium text-lg">{event.title}</h4>
        <Badge className={cn(
          "flex items-center gap-1 text-xs font-medium",
          event.category in categoryColors 
            ? categoryColors[event.category] 
            : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
        )}>
          {icon}
          {event.category}
        </Badge>
      </div>
      
      <div className="space-y-2 text-sm text-muted-foreground">
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
