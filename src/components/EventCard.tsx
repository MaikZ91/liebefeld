import React, { useState, memo } from 'react';
import { type Event, normalizeRsvpCounts } from '../types/eventTypes';
import { Music, PartyPopper, Image, Dumbbell, Calendar, Clock, MapPin, Users, Landmark, Heart, ExternalLink, BadgePlus, DollarSign } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useEventContext } from '@/contexts/EventContext';
import EventLikeButton from "./EventLikeButton";
import EventLikeAvatars from './event-chat/EventLikeAvatars';

interface EventCardProps {
  event: Event;
  onClick?: () => void;
  className?: string;
  compact?: boolean;
  monochrome?: boolean;
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

const EventCard: React.FC<EventCardProps> = memo(({ event, onClick, className, compact = false, monochrome = false }) => {
  const { handleLikeEvent } = useEventContext();
  const [isLiking, setIsLiking] = useState(false);

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
          isTribe && "border-l-2 border-purple-500 bg-gradient-to-r from-purple-900/20 to-transparent",
          className
        )}
        onClick={onClick}
      >
        <div className="flex items-start gap-2">
          {event.image_url && (
            <div className="flex-shrink-0 w-8 h-8 rounded-full overflow-hidden">
              <img
                src={event.image_url}
                alt={event.title}
                className={cn("w-full h-full object-cover", monochrome && "grayscale")}
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
          </div>
        </div>
      </div>
    );
  }

  // Non-compact version
  return (
    <div
      className={cn(
        "dark-glass-card rounded-xl p-4 cursor-pointer hover-scale w-full",
        isTribe && "border-l-4 border-purple-500 bg-gradient-to-r from-purple-900/20 to-transparent",
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
              className={cn("w-full h-full object-cover", monochrome && "grayscale")}
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
        </div>
      </div>

      <div className="flex items-center gap-2 text-sm text-white">
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
  );
});

EventCard.displayName = 'EventCard';

export default EventCard;
