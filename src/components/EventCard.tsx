import React from 'react';
import { type Event } from './EventCalendar';
import { Music, PartyPopper, Image, Dumbbell, Calendar, Clock, MapPin, Users, Landmark, Heart, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';

interface EventCardProps {
  event: Event;
  onClick?: () => void;
  className?: string;
  compact?: boolean;
  onLike?: (id: string) => void;
}

const categoryColors: Record<string, string> = {
  'Konzert': 'bg-orange-900/60 text-orange-100 dark:bg-orange-900/60 dark:text-orange-100',
  'Party': 'bg-red-900/60 text-red-100 dark:bg-red-900/60 dark:text-red-100',
  'Ausstellung': 'bg-orange-900/60 text-orange-100 dark:bg-orange-900/60 dark:text-orange-100',
  'Sport': 'bg-red-900/60 text-red-100 dark:bg-red-900/60 dark:text-red-100',
  'Workshop': 'bg-orange-900/60 text-orange-100 dark:bg-orange-900/60 dark:text-orange-100',
  'Kultur': 'bg-red-900/60 text-red-100 dark:bg-red-900/60 dark:text-red-100',
  'Sonstiges': 'bg-orange-800/60 text-orange-200 dark:bg-orange-800/60 dark:text-orange-200',
  'Networking': 'bg-orange-900/60 text-orange-100 dark:bg-orange-900/60 dark:text-orange-100',
  'Meeting': 'bg-orange-800/60 text-orange-200 dark:bg-orange-800/60 dark:text-orange-200',
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

const EventCard: React.FC<EventCardProps> = ({ event, onClick, className, compact = false, onLike }) => {
  const icon = event.category in categoryIcons 
    ? categoryIcons[event.category] 
    : <Calendar className="w-4 h-4" />;

  const handleLike = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onLike) {
      onLike(event.id);
      toast({
        description: "Event wurde geliked!",
        duration: 1500,
      });
    }
  };

  const handleLinkClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (event.link) {
      window.open(event.link, '_blank', 'noopener,noreferrer');
    }
  };

  if (compact) {
    return (
      <div 
        className={cn(
          "dark-glass-card rounded-lg p-2 cursor-pointer hover-scale mb-2 mx-1 w-[calc(100%-8px)]",
          className
        )}
        onClick={onClick}
      >
        <div className="flex justify-between items-start gap-1">
          <div className="flex-1 min-w-0">
            {event.link ? (
              <h4 
                className="font-medium text-sm text-white break-words line-clamp-2 text-left hover:underline cursor-pointer flex items-center gap-1"
                onClick={handleLinkClick}
              >
                {event.title}
                <ExternalLink className="w-3 h-3 inline-flex flex-shrink-0" />
              </h4>
            ) : (
              <h4 className="font-medium text-sm text-white break-words line-clamp-2 text-left">
                {event.title}
              </h4>
            )}
            
            <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-gray-300">
              <div className="flex items-center">
                <Clock className="w-3 h-3 mr-1 flex-shrink-0" />
                <span>{event.time}</span>
              </div>
              <div className="flex items-center max-w-[150px] overflow-hidden">
                <MapPin className="w-3 h-3 mr-1 flex-shrink-0" />
                <span className="truncate">{event.location}</span>
              </div>
            </div>
          </div>
          
          <div className="flex flex-col items-end gap-1">
            <Badge className={cn(
              "flex-shrink-0 flex items-center gap-1 text-xs font-medium whitespace-nowrap",
              event.category in categoryColors 
                ? categoryColors[event.category] 
                : "bg-gray-800/60 text-gray-200"
            )}>
              {icon}
            </Badge>
            
            <div className="flex items-center">
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-6 w-6 rounded-full" 
                onClick={handleLike}
              >
                <Heart className={cn("w-4 h-4", event.likes && event.likes > 0 ? "fill-red-500 text-red-500" : "text-gray-400")} />
              </Button>
              {event.likes && event.likes > 0 && (
                <span className="text-xs text-gray-300">{event.likes}</span>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      className={cn(
        "dark-glass-card rounded-xl p-4 cursor-pointer hover-scale w-full",
        className
      )}
      onClick={onClick}
    >
      <div className="flex justify-between items-start mb-2 gap-2">
        {event.link ? (
          <h4 
            className="font-medium text-lg text-white break-words hover:underline cursor-pointer flex items-center gap-1"
            onClick={handleLinkClick}
          >
            {event.title}
            <ExternalLink className="w-4 h-4 inline-flex flex-shrink-0" />
          </h4>
        ) : (
          <h4 className="font-medium text-lg text-white break-words">
            {event.title}
          </h4>
        )}
        
        <div className="flex flex-col items-end gap-2">
          <Badge className={cn(
            "flex-shrink-0 flex items-center gap-1 text-xs font-medium whitespace-nowrap",
            event.category in categoryColors 
              ? categoryColors[event.category] 
              : "bg-gray-800/60 text-gray-200"
          )}>
            {icon}
            {event.category}
          </Badge>
          
          <div className="flex items-center">
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-7 w-7 rounded-full mr-1"
              onClick={handleLike}
            >
              <Heart className={cn("w-4 h-4", event.likes && event.likes > 0 ? "fill-red-500 text-red-500" : "text-gray-400")} />
            </Button>
            {event.likes && event.likes > 0 && (
              <span className="text-sm text-gray-300">{event.likes}</span>
            )}
          </div>
        </div>
      </div>
      
      <div className="space-y-2 text-sm text-gray-300">
        <div className="flex items-center">
          <Clock className="w-4 h-4 mr-2 flex-shrink-0" />
          <span>{event.time} Uhr</span>
        </div>
        
        <div className="flex items-center overflow-hidden">
          <MapPin className="w-4 h-4 mr-2 flex-shrink-0" />
          <span className="break-words">{event.location}</span>
        </div>
      </div>
    </div>
  );
};

export default EventCard;
