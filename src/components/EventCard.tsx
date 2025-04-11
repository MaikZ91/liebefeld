
import React, { useState } from 'react';
import { type Event, normalizeRsvpCounts } from '../types/eventTypes';
import { Music, PartyPopper, Image, Dumbbell, Calendar, Clock, MapPin, Users, Landmark, Heart, ExternalLink, Check, HelpCircle, X, BadgePlus, DollarSign } from 'lucide-react';
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
  const [optimisticLikes, setOptimisticLikes] = useState<number | undefined>(undefined);
  const [isLiking, setIsLiking] = useState(false);
  const { newEventIds } = useEventContext();
  
  const isNewEvent = newEventIds.has(event.id);
  const displayLikes = optimisticLikes !== undefined ? optimisticLikes : (event.likes || 0);
  
  const icon = event.category in categoryIcons 
    ? categoryIcons[event.category] 
    : <Calendar className="w-4 h-4" />;

  const handleLike = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onLike && !isLiking) {
      setIsLiking(true);
      const newLikeCount = (event.likes || 0) + 1;
      setOptimisticLikes(newLikeCount);
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
  const totalRsvp = rsvpCounts.yes + rsvpCounts.no + rsvpCounts.maybe;

  if (compact) {
    return (
      <div 
        className={cn(
          "dark-glass-card rounded-lg p-2 cursor-pointer hover-scale mb-2 w-full",
          className
        )}
        onClick={onClick}
      >
        <div className="flex justify-between items-start gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1 flex-wrap">
              {isNewEvent && (
                <Badge className="bg-green-600 text-white text-xs flex items-center gap-0.5 h-4 px-1.5">
                  <BadgePlus className="w-3 h-3" />
                  <span>Neu</span>
                </Badge>
              )}
              {event.is_paid && (
                <Badge className="bg-amber-500 text-white text-xs flex items-center gap-0.5 h-4 px-1.5">
                  <DollarSign className="w-3 h-3" />
                </Badge>
              )}
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
            </div>
            
            <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-white">
              <div className="flex items-center">
                <Clock className="w-3 h-3 mr-1 flex-shrink-0" />
                <span>{event.time}</span>
              </div>
              <div className="flex items-center max-w-[200px] overflow-hidden">
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
                : "bg-orange-400/70 text-orange-50"
            )}>
              {icon}
            </Badge>
            
            <div className="flex items-center gap-2">
              <Button 
                variant="ghost" 
                size="icon" 
                className={cn(
                  "h-6 w-6 rounded-full transition-all", 
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
                <span className="text-xs text-white">{displayLikes}</span>
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
        
        <div className="flex flex-col items-end gap-2 w-1/5">
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
