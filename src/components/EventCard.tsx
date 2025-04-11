import React, { useState } from 'react';
import { type Event, normalizeRsvpCounts } from '../types/eventTypes';
import { Music, PartyPopper, Image, Dumbbell, Calendar, Clock, MapPin, Users, Landmark, Heart, ExternalLink, BadgePlus, DollarSign } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useEventContext } from '@/contexts/EventContext';

interface EventCardProps {
  event: Event;
  onClick?: () => void;
  className?: string;
  compact?: boolean;
  onLike?: (id: string) => void;
}

const categoryColors: Record<string, string> = {
  'Konzert': 'bg-black text-red-500 dark:bg-black dark:text-red-500',
  'Party': 'bg-black text-red-500 dark:bg-black dark:text-red-500',
  'Ausstellung': 'bg-orange-500/70 text-orange-50 dark:bg-orange-500/70 dark:text-orange-50',
  'Sport': 'bg-red-500/70 text-red-50 dark:bg-red-500/70 dark:text-red-50',
  'Workshop': 'bg-orange-500/70 text-orange-50 dark:bg-orange-500/70 dark:text-orange-50',
  'Kultur': 'bg-red-500/70 text-red-50 dark:bg-red-500/70 dark:text-red-50',
  'Sonstiges': 'bg-black text-red-500 dark:bg-black dark:text-red-500',
  'Networking': 'bg-orange-500/70 text-orange-50 dark:bg-orange-500/70 dark:text-orange-50',
  'Meeting': 'bg-orange-400/70 text-orange-50 dark:bg-orange-400/70 dark:text-orange-50',
};

const categoryIcons: Record<string, React.ReactNode> = {
  'Konzert': <Music className="w-3 h-3" />,
  'Party': <PartyPopper className="w-3 h-3" />,
  'Ausstellung': <Image className="w-3 h-3" />,
  'Sport': <Dumbbell className="w-3 h-3" />,
  'Workshop': <Users className="w-3 h-3" />,
  'Kultur': <Landmark className="w-3 h-3" />,
  'Sonstiges': <Calendar className="w-3 h-3" />,
  'Networking': <Users className="w-3 h-3" />,
  'Meeting': <Users className="w-3 h-3" />,
};

const EventCard: React.FC<EventCardProps> = ({ event, onClick, className, compact = false, onLike }) => {
  const [isLiking, setIsLiking] = useState(false);
  const { newEventIds, eventLikes } = useEventContext();
  
  const isNewEvent = newEventIds.has(event.id);
  
  const displayLikes = event.id.startsWith('github-') && eventLikes[event.id] !== undefined 
    ? eventLikes[event.id] 
    : (event.likes || 0);
  
  const icon = event.category in categoryIcons 
    ? categoryIcons[event.category] 
    : <Calendar className="w-3 h-3" />;

  const handleLike = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onLike && !isLiking) {
      setIsLiking(true);
      onLike(event.id);
      setTimeout(() => {
        setIsLiking(false);
      }, 300);
    }
  };

  const handleLinkClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (event.link) {
      window.open(event.link, '_blank', 'noopener,noreferrer');
    }
  };

  const rsvpCounts = normalizeRsvpCounts(event);

  if (compact) {
    return (
      <div 
        className={cn(
          "dark-glass-card rounded-lg p-1.5 cursor-pointer hover-scale mb-0.5 w-full",
          className
        )}
        onClick={onClick}
      >
        <div className="flex justify-between items-start gap-1">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1 flex-wrap">
              {isNewEvent && (
                <Badge className="bg-green-600 text-white text-[10px] flex items-center gap-0.5 h-3 px-1">
                  <BadgePlus className="w-2 h-2" />
                  <span>Neu</span>
                </Badge>
              )}
              {event.is_paid && (
                <Badge className="bg-amber-500 text-white text-[10px] flex items-center gap-0.5 h-3 px-1">
                  <DollarSign className="w-2 h-2" />
                </Badge>
              )}
              {event.link ? (
                <h4 
                  className="font-medium text-xs text-white break-words line-clamp-1 text-left hover:underline cursor-pointer flex items-center gap-1"
                  onClick={handleLinkClick}
                >
                  {event.title}
                  <ExternalLink className="w-2 h-2 inline-flex flex-shrink-0" />
                </h4>
              ) : (
                <h4 className="font-medium text-xs text-white break-words line-clamp-1 text-left">
                  {event.title}
                </h4>
              )}
            </div>
            
            <div className="flex flex-wrap items-center gap-1 mt-0.5 text-[8px] text-white">
              <div className="flex items-center">
                <Clock className="w-2 h-2 mr-0.5 flex-shrink-0" />
                <span>{event.time}</span>
              </div>
              <div className="flex items-center max-w-[120px] overflow-hidden">
                <MapPin className="w-2 h-2 mr-0.5 flex-shrink-0" />
                <span className="truncate">{event.location}</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Badge className={cn(
              "flex-shrink-0 flex items-center gap-0.5 text-[8px] font-medium whitespace-nowrap px-1 py-0 h-3",
              event.category in categoryColors 
                ? categoryColors[event.category] 
                : "bg-orange-400/70 text-orange-50"
            )}>
              {icon}
            </Badge>
            
            <div className="flex items-center gap-0.5">
              <Button 
                variant="ghost" 
                size="icon" 
                className={cn(
                  "h-4 w-4 rounded-full transition-all p-0", 
                  isLiking ? "opacity-70" : ""
                )}
                onClick={handleLike}
                disabled={isLiking}
              >
                <Heart className={cn(
                  "w-2 h-2 transition-transform text-white", 
                  displayLikes > 0 ? "fill-red-500 text-white" : "",
                  isLiking ? "scale-125" : ""
                )} />
              </Button>
              {displayLikes > 0 && (
                <span className="text-[8px] text-white">{displayLikes}</span>
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
        <div className="flex flex-col w-4/5">
          <div className="flex flex-wrap gap-1 mb-1">
            {isNewEvent && (
              <Badge className="bg-green-600 text-white text-xs flex items-center gap-1 h-5 px-2 self-start">
                <BadgePlus className="w-3 h-3" />
                <span>Neu</span>
              </Badge>
            )}
            {event.is_paid && (
              <Badge className="bg-amber-500 text-white text-xs flex items-center gap-1 h-5 px-2 self-start">
                <DollarSign className="w-3 h-3" />
                <span>Kostenpflichtig</span>
              </Badge>
            )}
          </div>
          {event.link ? (
            <h4 
              className="font-medium text-2xl text-white break-words hover:underline cursor-pointer flex items-center gap-1"
              onClick={handleLinkClick}
            >
              {event.title}
              <ExternalLink className="w-5 h-5 inline-flex flex-shrink-0" />
            </h4>
          ) : (
            <h4 className="font-medium text-2xl text-white break-words">
              {event.title}
            </h4>
          )}
        </div>
        
        <div className="flex items-center gap-3 w-1/5 justify-end">
          <Badge className={cn(
            "flex-shrink-0 flex items-center gap-1 text-xs font-medium whitespace-nowrap",
            event.category in categoryColors 
              ? categoryColors[event.category] 
              : "bg-orange-400/70 text-orange-50"
          )}>
            {icon}
            {event.category}
          </Badge>
          
          <div className="flex items-center">
            <Button 
              variant="ghost" 
              size="icon" 
              className={cn(
                "h-7 w-7 rounded-full mr-1 transition-all",
                isLiking ? "opacity-70" : ""
              )}
              onClick={handleLike}
              disabled={isLiking}
            >
              <Heart className={cn(
                "w-4 h-4 transition-transform text-white", 
                displayLikes > 0 ? "fill-red-500 text-white" : "",
                isLiking ? "scale-125" : ""
              )} />
            </Button>
            {displayLikes > 0 && (
              <span className="text-sm text-white">{displayLikes}</span>
            )}
          </div>
        </div>
      </div>
      
      <div className="space-y-2 text-sm text-white">
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
