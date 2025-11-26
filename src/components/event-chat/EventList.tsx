
import React, { useMemo, useState } from 'react';
import { format, parseISO } from 'date-fns';
import { de } from 'date-fns/locale';
import { Heart, ThumbsDown, ChevronDown, ExternalLink, MapPin, Clock, User } from 'lucide-react';
import { TribeEvent } from '@/types/tribe';
import { getVibeBadgeColor } from '@/utils/tribe/eventHelpers';
import './MessageList.css';

interface EventListProps {
  events: TribeEvent[];
  onEventLike?: (eventId: string) => void;
  onEventDislike?: (eventId: string) => void;
  likedEventIds?: Set<string>;
}

type VibeFilter = 'ALL' | 'RAGE' | 'CHILL' | 'ARTSY' | 'FLIRTY';

const EventList: React.FC<EventListProps> = ({ 
  events, 
  onEventLike,
  onEventDislike,
  likedEventIds = new Set()
}) => {
  const [expandedEventId, setExpandedEventId] = useState<string | null>(null);
  const [vibeFilter, setVibeFilter] = useState<VibeFilter>('ALL');

  // Group events by date
  const groupedEvents = useMemo(() => {
    const filtered = vibeFilter === 'ALL' 
      ? events 
      : events.filter(e => e.vibe === vibeFilter);

    const grouped: Record<string, TribeEvent[]> = {};
    filtered.forEach(event => {
      if (!grouped[event.date]) {
        grouped[event.date] = [];
      }
      grouped[event.date].push(event);
    });
    return grouped;
  }, [events, vibeFilter]);

  const sortedDates = Object.keys(groupedEvents).sort();

  const formatDateHeader = (dateStr: string) => {
    try {
      const date = parseISO(dateStr);
      return format(date, 'EEEE, d. MMMM', { locale: de });
    } catch {
      return dateStr;
    }
  };

  const formatTime = (timeStr?: string | null) => {
    if (!timeStr) return '';
    return timeStr.substring(0, 5);
  };

  const toggleExpand = (eventId: string) => {
    setExpandedEventId(expandedEventId === eventId ? null : eventId);
  };

  const VIBE_FILTERS: VibeFilter[] = ['ALL', 'RAGE', 'CHILL', 'ARTSY', 'FLIRTY'];

  return (
    <div className="bg-black text-white pb-24">
      {/* Vibe Filter Chips */}
      <div className="sticky top-0 z-20 bg-black/95 backdrop-blur-md border-b border-white/5 px-4 py-3">
        <div className="flex gap-2 overflow-x-auto no-scrollbar">
          {VIBE_FILTERS.map(vibe => (
            <button
              key={vibe}
              onClick={() => setVibeFilter(vibe)}
              className={`px-3 py-1.5 text-xs font-medium uppercase tracking-wider whitespace-nowrap rounded-full border transition-all ${
                vibeFilter === vibe
                  ? 'bg-gold text-black border-gold'
                  : 'bg-black text-zinc-500 border-white/10 hover:border-white/30 hover:text-white'
              }`}
            >
              {vibe}
            </button>
          ))}
        </div>
      </div>

      {/* Event List */}
      <div className="px-4">
        {sortedDates.map(date => (
          <div key={date} className="mb-6">
            {/* Date Header */}
            <h2 className="text-xl font-serif text-white mb-3 mt-6 first:mt-3">
              {formatDateHeader(date)}
            </h2>

            {/* Events for this date */}
            {groupedEvents[date].map(event => {
              const isExpanded = expandedEventId === event.id;
              const isLiked = likedEventIds.has(event.id);
              const isTopEvent = event.likes && event.likes > 0;
              const likeCount = event.likes || 0;
              const avatars = event.liked_by_users?.slice(0, 3) || [];

              return (
                <div
                  key={event.id}
                  className={`bg-zinc-950 border border-white/5 rounded-lg mb-2 overflow-hidden transition-all ${
                    isLiked ? 'border-gold/30' : ''
                  }`}
                >
                  {/* Main Event Row */}
                  <div className="flex items-center gap-3 p-3">
                    {/* Event Image */}
                    <div className="w-16 h-16 flex-shrink-0 bg-zinc-900 rounded overflow-hidden relative">
                      {event.image_url ? (
                        <img 
                          src={event.image_url} 
                          alt={event.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <span className="text-xs text-zinc-700">?</span>
                        </div>
                      )}
                      {isTopEvent && (
                        <div className="absolute top-0.5 right-0.5 bg-gold text-black text-[8px] font-bold px-1 py-0.5 rounded">
                          ★ Top
                        </div>
                      )}
                    </div>

                    {/* Event Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className={`text-sm font-medium truncate mb-1 ${isLiked ? 'text-gold' : 'text-white'}`}>
                        {event.title}
                      </h3>
                      <div className="flex items-center gap-2 text-xs text-zinc-500">
                        <div className="flex items-center gap-1">
                          <Clock size={10} />
                          <span>{formatTime(event.time)}</span>
                        </div>
                        {event.location && (
                          <>
                            <span>•</span>
                            <div className="flex items-center gap-1 truncate">
                              <MapPin size={10} />
                              <span className="truncate">{event.location}</span>
                            </div>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        onClick={() => onEventDislike?.(event.id)}
                        className="p-1.5 text-zinc-600 hover:text-red-500 transition-colors"
                      >
                        <ThumbsDown size={14} />
                      </button>
                      <button
                        onClick={() => onEventLike?.(event.id)}
                        className={`p-1.5 transition-colors ${
                          isLiked ? 'text-gold' : 'text-zinc-600 hover:text-gold'
                        }`}
                      >
                        <Heart size={14} fill={isLiked ? 'currentColor' : 'none'} />
                      </button>
                      {likeCount > 0 && (
                        <div className="flex items-center gap-1 ml-1">
                          <span className="text-xs text-zinc-500 font-mono">{likeCount}</span>
                          {avatars.length > 0 && (
                            <div className="flex -space-x-2">
                              {avatars.map((user, i) => (
                                <div key={i} className="w-5 h-5 rounded-full bg-zinc-800 border border-black overflow-hidden">
                                  {user.avatar_url ? (
                                    <img src={user.avatar_url} className="w-full h-full object-cover" alt="" />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                      <User size={10} className="text-zinc-600" />
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                      <button
                        onClick={() => toggleExpand(event.id)}
                        className="p-1.5 text-zinc-600 hover:text-white transition-all"
                      >
                        <ChevronDown 
                          size={14} 
                          className={`transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                        />
                      </button>
                    </div>
                  </div>

                  {/* Expanded Details */}
                  {isExpanded && (
                    <div className="border-t border-white/5 p-3 space-y-2 bg-black/30 animate-fadeIn">
                      {event.description && (
                        <p className="text-xs text-zinc-400 leading-relaxed">{event.description}</p>
                      )}
                      {event.vibe && (
                        <div className="flex gap-2">
                          <span className={`text-[10px] px-2 py-1 rounded-full border ${getVibeBadgeColor(event.vibe)}`}>
                            {event.vibe}
                          </span>
                        </div>
                      )}
                      {event.link && (
                        <a
                          href={event.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-gold hover:text-white transition-colors"
                        >
                          <ExternalLink size={12} />
                          <span>Event Details</span>
                        </a>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ))}

        {sortedDates.length === 0 && (
          <div className="text-center py-12 text-zinc-500">
            <p>Keine Events gefunden</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default EventList;
