import React, { useState, memo } from 'react';
import { type Event, normalizeRsvpCounts } from '../types/eventTypes';
import { Music, PartyPopper, Image, Dumbbell, Calendar, Clock, MapPin, Users, Landmark, Heart, ExternalLink, BadgePlus, DollarSign, ThumbsDown, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useEventContext } from '@/contexts/EventContext';
import EventLikeButton from "./EventLikeButton";
import EventLikeAvatars from './event-chat/EventLikeAvatars';
import { dislikeService } from '@/services/dislikeService';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface EventCardProps {
  event: Event;
  onClick?: () => void;
  className?: string;
  compact?: boolean;
  monochrome?: boolean;
  onDislike?: (eventId: string) => void;
}

// Category icon mappings
const categoryIcons: Record<string, React.ReactNode> = {
  'Konzert': <Music className="w-3 h-3" />,
  'Party': <PartyPopper className="w-3 h-3" />,
  'Festival': <Music className="w-3 h-3" />,
  'Ausstellung': <Image className="w-3 h-3" />,
  'Sport': <Dumbbell className="w-3 h-3" />,
  'Workshop': <Users className="w-3 h-3" />,
  'Theater': <Landmark className="w-3 h-3" />,
  'Kino': <Image className="w-3 h-3" />,
  'Lesung': <Users className="w-3 h-3" />,
  'Sonstiges': <Calendar className="w-3 h-3" />
};

const categoryColors: Record<string, string> = {
  'Konzert': 'bg-purple-500/70 text-purple-50',
  'Party': 'bg-pink-500/70 text-pink-50',
  'Festival': 'bg-indigo-500/70 text-indigo-50',
  'Ausstellung': 'bg-teal-500/70 text-teal-50',
  'Sport': 'bg-green-500/70 text-green-50',
  'Workshop': 'bg-blue-500/70 text-blue-50',
  'Theater': 'bg-red-500/70 text-red-50',
  'Kino': 'bg-yellow-500/70 text-yellow-50',
  'Lesung': 'bg-gray-500/70 text-gray-50',
  'Sonstiges': 'bg-orange-400/70 text-orange-50'
};

const isTribeEvent = (title: string): boolean => {
  const tribeKeywords = ['tribe', 'tuesday run', 'kennenlernabend', 'creatives circle'];
  return tribeKeywords.some(keyword =>
    title.toLowerCase().includes(keyword.toLowerCase())
  );
};

// Function to check if event is new based on created_at (last 24 hours)
const isEventNew = (event: Event): boolean => {
  if (!event.created_at) return false;
  const now = new Date();
  const twentyFourHoursAgo = new Date(now.getTime() - (24 * 60 * 60 * 1000));
  return new Date(event.created_at) > twentyFourHoursAgo;
};

const EventCard: React.FC<EventCardProps> = memo(({ event, onClick, className, compact = false, monochrome = false, onDislike }) => {
  const { handleLikeEvent } = useEventContext();
  const [isLiking, setIsLiking] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [description, setDescription] = useState<string>('');
  const [isLoadingDescription, setIsLoadingDescription] = useState(false);

  // Helper um Likes zu zeigen (State bevorzugt, sonst Fallback):
  const currentLikes = event.likes || 0;

  const isNewEvent = isEventNew(event);
  const isTribe = isTribeEvent(event.title);

  const icon = event.category in categoryIcons
    ? categoryIcons[event.category]
    : <Calendar className="w-3 h-3" />;

  const handleLike = async (e: React.MouseEvent) => {
    e.stopPropagation();

    if (isLiking) return;
    if (!event?.id) {
      console.error("[LIKE HANDLER] Kein Event-ID! Kann Like nicht ausführen.", event);
      return;
    }

    setIsLiking(true);
    await handleLikeEvent(event.id);
    setTimeout(() => setIsLiking(false), 250);
  };

  const handleDislike = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!event?.id) {
      console.error("[DISLIKE HANDLER] Kein Event-ID! Kann Dislike nicht ausführen.", event);
      return;
    }

    await dislikeService.dislikeEvent(event.id, event.location);
    onDislike?.(event.id);
  };

  const handleLinkClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (event.link) {
      window.open(event.link, '_blank', 'noopener,noreferrer');
    }
  };

  const handleCardClick = async (e: React.MouseEvent) => {
    // Don't expand if clicking on buttons or links
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('a')) {
      return;
    }

    if (onClick) {
      onClick();
      return;
    }

    // If collapsing, just toggle
    if (isExpanded) {
      setIsExpanded(false);
      return;
    }

    // Expanding: open immediately and load description
    setIsExpanded(true);

    // Load description if not already loaded
    if (!description && !isLoadingDescription) {
      setIsLoadingDescription(true);
      try {
        const response = await fetch('https://pxbpscfhrvnsawegqvpe.supabase.co/functions/v1/fetch-event-description', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            eventLink: event.link,
            eventData: {
              title: event.title,
              category: event.category,
              location: event.location,
              organizer: event.organizer
            }
          })
        });
        
        const data = await response.json();
        setDescription(data.description || 'Keine Beschreibung verfügbar.');
      } catch (error) {
        console.error('Error fetching description:', error);
        setDescription('Beschreibung konnte nicht geladen werden.');
      } finally {
        setIsLoadingDescription(false);
      }
    }
  };

  const rsvpCounts = normalizeRsvpCounts(event);

  if (compact) {
    return (
      <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
        <div
          className={cn(
            "bg-card text-card-foreground border border-border rounded-lg mb-0.5 w-full transition-all duration-200",
            isTribe && "border-l-2 border-purple-500 bg-gradient-to-r from-purple-900/20 to-transparent",
            className
          )}
        >
          <CollapsibleTrigger asChild>
            <div 
              className="p-1.5 cursor-pointer hover-scale"
              onClick={handleCardClick}
            >
        <div className="flex items-start gap-2">
          {event.image_url && (
            <div className="flex-shrink-0 w-8 h-8 rounded-full overflow-hidden">
              <img
                src={event.image_url}
                alt={event.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1 flex-wrap">
              {isNewEvent && (
                <Badge className={cn(
                  "text-[10px] flex items-center gap-0.5 h-3 px-1",
                  monochrome ? "bg-white/10 text-white border border-white/20" : "bg-green-600 text-white"
                )}>
                  <BadgePlus className="w-2 h-2" />
                  <span>Neu</span>
                </Badge>
              )}
              {event.is_paid && (
                <Badge className={cn(
                  "text-[10px] flex items-center gap-0.5 h-3 px-1",
                  monochrome ? "bg-white/10 text-white border border-white/20" : "bg-amber-500 text-white"
                )}>
                  <DollarSign className="w-2 h-2" />
                </Badge>
              )}
              {isTribe && (
                <Badge className={cn(
                  "text-[10px] flex items-center gap-0.5 h-3 px-1",
                  monochrome ? "bg-white/10 text-white border border-white/20" : "bg-purple-600 text-white"
                )}>
                  <Users className="w-2 h-2" />
                  <span>Tribe</span>
                </Badge>
              )}
              {event.link ? (
                <h4
                  className={cn(
                    "font-medium text-xs text-white break-words line-clamp-1 text-left hover:underline cursor-pointer flex items-center gap-1",
                    isTribe && "text-purple-300"
                  )}
                  onClick={handleLinkClick}
                >
                  {event.title}
                  <ExternalLink className="w-2 h-2 inline-flex flex-shrink-0" />
                </h4>
              ) : (
                <h4 className={cn(
                  "font-medium text-xs text-white break-words line-clamp-1 text-left",
                  isTribe && "text-purple-300"
                )}>
                  {event.title}
                </h4>
              )}
            </div>

            <div className="flex items-center gap-1 mt-0.5 text-[8px] text-white">
              <div className="flex items-center">
                <Clock className="w-2 h-2 mr-0.5 flex-shrink-0" />
                <span>{event.time}</span>
              </div>
              <span className="mx-0.5">•</span>
              <div className="flex items-center max-w-[120px] overflow-hidden">
                <MapPin className="w-2 h-2 mr-0.5 flex-shrink-0" />
                <span className="truncate">{event.location}</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col items-end gap-1">
            <Badge className={cn(
              "flex-shrink-0 flex items-center gap-0.5 text-[8px] font-medium whitespace-nowrap px-1 py-0 h-3",
              monochrome
                ? "border border-white/30 text-white/80 bg-transparent"
                : event.category in categoryColors
                  ? categoryColors[event.category]
                  : "bg-orange-400/70 text-orange-50"
            )}>
              {icon}
            </Badge>

            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDislike}
                className="h-6 w-6 p-0 hover:bg-red-500/20"
              >
                <ThumbsDown className="w-3 h-3 text-red-400" />
              </Button>
              
              <div className="flex flex-col items-end gap-1">
                <EventLikeButton
                  likes={currentLikes}
                  isLiking={isLiking}
                  onLike={handleLike}
                  small
                />
                
                {/* Like Avatars for compact view */}
                {event.liked_by_users && event.liked_by_users.length > 0 && (
                  <EventLikeAvatars 
                    likedByUsers={event.liked_by_users} 
                    maxVisible={2}
                    size="xs"
                  />
                )}
              </div>

              {/* Expand/Collapse indicator */}
              <div className="ml-1">
                {isExpanded ? (
                  <ChevronUp className="w-3 h-3 text-muted-foreground" />
                ) : (
                  <ChevronDown className="w-3 h-3 text-muted-foreground" />
                )}
              </div>
            </div>
          </div>
        </div>
            </div>
      </CollapsibleTrigger>

      <CollapsibleContent className="px-1.5 pb-2 animate-accordion-down">
        <div className="mt-2 p-3 bg-background/50 backdrop-blur-sm rounded-lg border border-border/50">
          {isLoadingDescription ? (
            <div className="flex items-center justify-center py-4">
              <div className="animate-pulse text-xs text-muted-foreground">Lade Beschreibung...</div>
            </div>
          ) : (
            <p className="text-xs text-foreground/90 leading-relaxed whitespace-pre-wrap">
              {description || 'Klicke, um die Beschreibung zu laden.'}
            </p>
          )}
        </div>
      </CollapsibleContent>
    </div>
    </Collapsible>
    );
  }

  // Non-compact version
  return (
    <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
      <div
        className={cn(
          "bg-card text-card-foreground border border-border rounded-xl w-full transition-all duration-200",
          isTribe && "border-l-4 border-purple-500 bg-gradient-to-r from-purple-900/20 to-transparent",
          className
        )}
      >
        <CollapsibleTrigger asChild>
          <div 
            className="p-4 cursor-pointer hover-scale"
            onClick={handleCardClick}
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
            {isTribe && (
              <Badge className="bg-purple-600 text-white text-xs flex items-center gap-1 h-5 px-2 self-start">
                <Users className="w-3 h-3" />
                <span>Tribe</span>
              </Badge>
            )}
          </div>
          {event.link ? (
            <h4
              className={cn(
                "font-medium text-xl text-white break-words hover:underline cursor-pointer flex items-center gap-1",
                isTribe && "text-purple-300"
              )}
              onClick={handleLinkClick}
            >
              {event.title}
              <ExternalLink className="w-5 h-5 inline-flex flex-shrink-0" />
            </h4>
          ) : (
            <h4 className={cn(
              "font-medium text-xl text-white break-words",
              isTribe && "text-purple-300"
            )}>
              {event.title}
            </h4>
          )}
        </div>

        {event.image_url && (
          <div className="flex-shrink-0 w-12 h-12 rounded-full overflow-hidden ml-auto">
            <img
              src={event.image_url}
              alt={event.title}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        <div className="flex flex-col items-end gap-3 w-1/5">
          <Badge className={cn(
            "flex-shrink-0 flex items-center gap-1 text-xs font-medium whitespace-nowrap",
            monochrome
              ? "border border-white/30 text-white/80 bg-transparent"
              : event.category in categoryColors
                ? categoryColors[event.category]
                : "bg-orange-400/70 text-orange-50"
          )}>
            {icon}
            {!monochrome && event.category}
          </Badge>

            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDislike}
                className="h-8 w-8 p-0 hover:bg-red-500/20"
              >
                <ThumbsDown className="w-4 h-4 text-red-400" />
              </Button>
              
              <div className="flex flex-col items-end gap-2">
                <EventLikeButton
                  likes={currentLikes}
                  isLiking={isLiking}
                  onLike={handleLike}
                />
                
                {/* Like Avatars for normal view */}
                {event.liked_by_users && event.liked_by_users.length > 0 && (
                  <EventLikeAvatars 
                    likedByUsers={event.liked_by_users} 
                    maxVisible={3}
                    size="sm"
                  />
                )}
              </div>

              {/* Expand/Collapse indicator */}
              <div className="ml-2">
                {isExpanded ? (
                  <ChevronUp className="w-4 h-4 text-muted-foreground" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-muted-foreground" />
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 text-sm text-white px-4 pb-4">
          <div className="flex items-center">
            <Clock className="w-4 h-4 mr-1 flex-shrink-0" />
            <span>{event.time} Uhr</span>
          </div>
          <span className="mx-1">•</span>
          <div className="flex items-center overflow-hidden">
            <MapPin className="w-4 h-4 mr-1 flex-shrink-0" />
            <span className="break-words">{event.location}</span>
          </div>
        </div>
          </div>
      </CollapsibleTrigger>

      <CollapsibleContent className="px-4 pb-4 animate-accordion-down">
        <div className="p-4 bg-background/50 backdrop-blur-sm rounded-lg border border-border/50">
          {isLoadingDescription ? (
            <div className="flex items-center justify-center py-6">
              <div className="animate-pulse text-sm text-muted-foreground">Lade Beschreibung...</div>
            </div>
          ) : (
            <p className="text-sm text-foreground/90 leading-relaxed whitespace-pre-wrap">
              {description || 'Klicke, um die Beschreibung zu laden.'}
            </p>
          )}
        </div>
      </CollapsibleContent>
    </div>
    </Collapsible>
  );
});

EventCard.displayName = 'EventCard';

export default EventCard;
