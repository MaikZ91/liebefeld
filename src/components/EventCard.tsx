
import React from 'react';
import { type Event } from '@/types/eventTypes';
import { Music, PartyPopper, Image, Dumbbell, Calendar, Clock, MapPin, Users, Landmark, Heart, ExternalLink, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface EventCardProps {
  event: Event;
  onClick?: () => void;
  className?: string;
  compact?: boolean;
  onLike?: (id: string) => void;
}

const categoryColors: Record<string, string> = {
  'Konzert': 'bg-gradient-to-r from-pink-500 to-purple-500 text-white',
  'Party': 'bg-gradient-to-r from-orange-400 to-pink-500 text-white',
  'Ausstellung': 'bg-gradient-to-r from-amber-400 to-orange-500 text-white',
  'Sport': 'bg-gradient-to-r from-green-400 to-emerald-500 text-white',
  'Workshop': 'bg-gradient-to-r from-blue-400 to-indigo-500 text-white',
  'Kultur': 'bg-gradient-to-r from-purple-400 to-indigo-500 text-white',
  'Sonstiges': 'bg-gradient-to-r from-gray-400 to-slate-500 text-white',
  'Networking': 'bg-gradient-to-r from-cyan-400 to-blue-500 text-white',
  'Meeting': 'bg-gradient-to-r from-teal-400 to-cyan-500 text-white',
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
          "backdrop-blur-sm bg-white/10 dark:bg-white/5 border border-white/20 rounded-lg p-3 cursor-pointer hover:scale-102 hover:bg-white/15 transition-all duration-300 shadow-lg mb-2 mx-1 w-[calc(100%-8px)]",
          className
        )}
        onClick={onClick}
      >
        <div className="flex justify-between items-start gap-2">
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
            
            <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-white/80">
              <div className="flex items-center">
                <Clock className="w-3 h-3 mr-1 flex-shrink-0 text-white/60" />
                <span>{event.time}</span>
              </div>
              <div className="flex items-center max-w-[150px] overflow-hidden">
                <MapPin className="w-3 h-3 mr-1 flex-shrink-0 text-white/60" />
                <span className="truncate">{event.location}</span>
              </div>
            </div>
          </div>
          
          <div className="flex flex-col items-end gap-1">
            <Badge className={cn(
              "flex-shrink-0 flex items-center gap-1 text-xs font-medium whitespace-nowrap shadow-sm",
              event.category in categoryColors 
                ? categoryColors[event.category] 
                : "bg-gradient-to-r from-teal-400 to-cyan-500 text-white"
            )}>
              {icon}
            </Badge>
            
            <div className="flex items-center">
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-6 w-6 rounded-full relative group" 
                onClick={handleLike}
              >
                <Heart className={cn(
                  "w-4 h-4 transition-all duration-300",
                  event.likes && event.likes > 0
                    ? "fill-red-500 text-red-500 scale-110"
                    : "text-white group-hover:text-pink-300 group-hover:scale-110"
                )} />
                {event.likes && event.likes > 0 && (
                  <Sparkles className="w-3 h-3 absolute -top-1 -right-1 text-yellow-400 animate-pulse" />
                )}
              </Button>
              {event.likes && event.likes > 0 && (
                <span className="text-xs text-white">{event.likes}</span>
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
        "backdrop-blur-sm bg-white/10 dark:bg-white/5 border border-white/20 rounded-xl p-5 cursor-pointer hover:scale-102 hover:bg-white/15 transition-all duration-300 shadow-lg w-full",
        className
      )}
      onClick={onClick}
    >
      <div className="flex justify-between items-start mb-3 gap-2">
        <div className="flex items-center gap-2">
          <div className={cn(
            "w-10 h-10 rounded-full flex items-center justify-center text-white shadow-md",
            event.category in categoryColors 
              ? categoryColors[event.category].replace('text-white', '')
              : "bg-gradient-to-r from-teal-400 to-cyan-500"
          )}>
            {icon}
          </div>
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
        </div>
        
        <div className="flex flex-col items-end gap-2">
          <Badge className={cn(
            "flex-shrink-0 flex items-center gap-1 text-xs font-medium whitespace-nowrap shadow-md",
            event.category in categoryColors 
              ? categoryColors[event.category] 
              : "bg-gradient-to-r from-teal-400 to-cyan-500 text-white"
          )}>
            {event.category}
          </Badge>
          
          <div className="flex items-center">
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-7 w-7 rounded-full relative group"
              onClick={handleLike}
            >
              <Heart className={cn(
                "w-4 h-4 transition-all duration-300",
                event.likes && event.likes > 0
                  ? "fill-red-500 text-red-500 scale-110"
                  : "text-white group-hover:text-pink-300 group-hover:scale-110"
              )} />
              {event.likes && event.likes > 0 && (
                <Sparkles className="w-3 h-3 absolute -top-0 -right-0 text-yellow-400 animate-pulse" />
              )}
            </Button>
            {event.likes && event.likes > 0 && (
              <span className="text-sm text-white">{event.likes}</span>
            )}
          </div>
        </div>
      </div>
      
      <div className="space-y-2 text-sm text-white/80 pl-1">
        <div className="flex items-center">
          <Clock className="w-4 h-4 mr-2 flex-shrink-0 text-white/60" />
          <span>{event.time} Uhr</span>
        </div>
        
        <div className="flex items-center overflow-hidden">
          <MapPin className="w-4 h-4 mr-2 flex-shrink-0 text-white/60" />
          <span className="break-words">{event.location}</span>
        </div>
      </div>
    </div>
  );
};

export default EventCard;
