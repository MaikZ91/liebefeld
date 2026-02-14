import React, { useState, useMemo } from 'react';
import { TribeEvent } from '@/types/tribe';
import { GroupedEvent, groupSimilarEvents } from '@/utils/tribe/eventGrouping';
import { TribeEventCard } from './TribeEventCard';
import { ChevronDown, Filter, Map as MapIcon, Calendar as CalendarIcon, X } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { ViewState } from '@/types/tribe';
import hochschulsportImg from '@/assets/groups/hochschulsport.jpg';
import sportImg from '@/assets/groups/sport.jpg';
import vhsImg from '@/assets/groups/vhs.jpg';
import kinoImg from '@/assets/groups/kino.jpg';

const MIA_AVATAR = "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150&h=150";

const CATEGORIES = ["ALL", "FÜR MICH", "PARTY", "ART", "CONCERT", "SPORT"];

const GROUP_CONFIG: Record<string, { label: string; img: string }> = {
  hochschulsport: { label: 'HOCHSCHULSPORT', img: hochschulsportImg },
  sport: { label: 'SPORT', img: sportImg },
  vhs: { label: 'VHS & KURSE', img: vhsImg },
  kino: { label: 'KINO', img: kinoImg },
};

const getCollapsibleGroup = (event: GroupedEvent): string | null => {
  const title = (event.title || '').toLowerCase();
  const location = (event.location || '').toLowerCase();
  const organizer = (event.organizer || '').toLowerCase();
  const category = (event.category || '').toLowerCase();
  if (title.includes('hochschulsport') || organizer.includes('hochschulsport') || (title.includes('uni ') && (title.includes('sport') || title.includes('fitness')))) return 'hochschulsport';
  if (category === 'sport') return 'sport';
  if (title.includes('vhs') || title.includes('volkshochschule') || location.includes('vhs') || location.includes('volkshochschule') || title.includes('wochenmarkt')) return 'vhs';
  if (title.includes('kino') || location.includes('kino') || location.includes('lichtwerk') || location.includes('cinemaxx') || location.includes('cinestar') || location.includes('filmhaus') || title.includes('film:') || title.includes('filmstart')) return 'kino';
  return null;
};

interface ExploreSectionCompactProps {
  spotlightEvents: GroupedEvent[];
  feedEvents: TribeEvent[];
  likedEventIds: Set<string>;
  attendingEventIds: Set<string>;
  eventMatchScores: Map<string, number>;
  onInteraction: (eventId: string, type: 'like' | 'dislike') => void;
  onToggleAttendance: (eventId: string) => void;
  onJoinTribe?: (eventName: string) => void;
  onHeroScroll?: (e: React.UIEvent<HTMLDivElement>) => void;
  heroLoadedCount?: number;
  totalFilteredCount?: number;
  onViewChange?: (view: ViewState) => void;
  selectedCategory: string;
  onCategoryChange: (cat: string) => void;
  selectedDate?: Date;
  onDateChange: (date: Date | undefined) => void;
  onFetchEventsForDate?: (date: Date) => void;
  allEvents: TribeEvent[];
  miaFilteredEventIds: string[] | null;
  onMiaClearFilter: () => void;
  hasLikedFirstEvent: boolean;
  expandedGroups: Set<string>;
  onToggleGroup: (groupId: string) => void;
}

export const ExploreSectionCompact: React.FC<ExploreSectionCompactProps> = ({
  spotlightEvents,
  feedEvents,
  likedEventIds,
  attendingEventIds,
  eventMatchScores,
  onInteraction,
  onToggleAttendance,
  onJoinTribe,
  onHeroScroll,
  heroLoadedCount = 10,
  totalFilteredCount = 0,
  onViewChange,
  selectedCategory,
  onCategoryChange,
  selectedDate,
  onDateChange,
  onFetchEventsForDate,
  allEvents,
  miaFilteredEventIds,
  onMiaClearFilter,
  hasLikedFirstEvent,
  expandedGroups,
  onToggleGroup,
}) => {
  const [isFeedOpen, setIsFeedOpen] = useState(false);
  const [expandedDates, setExpandedDates] = useState<Set<string>>(new Set());

  // Group feed events by date
  const groupedByDate = useMemo(() => {
    const grouped = groupSimilarEvents(feedEvents);
    const byDate: Record<string, GroupedEvent[]> = {};
    grouped.forEach((event) => {
      if (!byDate[event.date]) byDate[event.date] = [];
      byDate[event.date].push(event);
    });
    return byDate;
  }, [feedEvents]);

  const sortedDates = useMemo(() => Object.keys(groupedByDate).sort(), [groupedByDate]);

  if (spotlightEvents.length === 0 && feedEvents.length === 0) return null;

  const now = new Date();
  const currentHour = now.getHours();
  const todayStr = now.toISOString().split("T")[0];
  const MAX_COLLAPSED_EVENTS = 5;

  const getEngagementScore = (e: TribeEvent) => {
    const likes = e.likes || 0;
    const attendees = e.attendees || 0;
    const likedBy = Array.isArray(e.liked_by_users) ? e.liked_by_users.length : 0;
    return (likes * 3) + attendees + (likedBy * 2);
  };

  const renderEvent = (event: GroupedEvent, isToday: boolean, topEventId: string | null) => {
    const isPastEvent = isToday && (() => {
      const match = event.time?.match(/^(\d{1,2})/);
      const hour = match ? parseInt(match[1], 10) : 23;
      return hour < currentHour;
    })();

    return (
      <div
        key={event.id}
        className={`animate-fade-in transition-all duration-300 ease-out ${isPastEvent ? 'opacity-40' : ''}`}
      >
        <TribeEventCard
          event={event}
          variant="compact"
          onJoinTribe={onJoinTribe}
          onInteraction={onInteraction}
          isLiked={likedEventIds.has(event.id) || event.allTimes?.some(t => likedEventIds.has(t.eventId))}
          isAttending={attendingEventIds.has(event.id) || event.allTimes?.some(t => attendingEventIds.has(t.eventId))}
          onToggleAttendance={onToggleAttendance}
          matchScore={eventMatchScores.get(event.id)}
          isPast={isPastEvent}
          isTopOfDay={event.id === topEventId && !isPastEvent}
          allTimes={event.allTimes}
        />
      </div>
    );
  };

  const renderDateSection = (date: string) => {
    const dateObj = new Date(date);
    const weekday = dateObj.toLocaleDateString("de-DE", { weekday: "long" });
    const day = dateObj.getDate();
    const month = dateObj.toLocaleDateString("de-DE", { month: "long" });
    const isToday = date === todayStr;

    const allEventsForDate = [...groupedByDate[date]].sort((a, b) => {
      if (!isToday) return 0;
      const getEventHour = (timeStr?: string | null) => {
        if (!timeStr) return 23;
        const match = timeStr.match(/^(\d{1,2})/);
        return match ? parseInt(match[1], 10) : 23;
      };
      const aIsPast = getEventHour(a.time) < currentHour;
      const bIsPast = getEventHour(b.time) < currentHour;
      if (aIsPast && !bIsPast) return 1;
      if (!aIsPast && bIsPast) return -1;
      return 0;
    });

    const activeEvents = isToday
      ? allEventsForDate.filter(e => { const m = e.time?.match(/^(\d{1,2})/); return (m ? parseInt(m[1], 10) : 23) >= currentHour; })
      : allEventsForDate;
    const pastEvents = isToday
      ? allEventsForDate.filter(e => { const m = e.time?.match(/^(\d{1,2})/); return (m ? parseInt(m[1], 10) : 23) < currentHour; })
      : [];

    const isExpanded = expandedDates.has(date);
    const shouldCollapse = (hasLikedFirstEvent && activeEvents.length > MAX_COLLAPSED_EVENTS) || pastEvents.length > 0;
    const displayedEvents = shouldCollapse && !isExpanded ? activeEvents.slice(0, MAX_COLLAPSED_EVENTS) : [...activeEvents, ...pastEvents];
    const hiddenActiveCount = Math.max(0, activeEvents.length - MAX_COLLAPSED_EVENTS);
    const hiddenCount = (hasLikedFirstEvent ? hiddenActiveCount : 0) + pastEvents.length;

    const topEventOfDay = activeEvents.length > 0
      ? activeEvents.reduce((top, current) => getEngagementScore(current) > getEngagementScore(top) ? current : top, activeEvents[0])
      : null;
    const topEventId = topEventOfDay && getEngagementScore(topEventOfDay) > 0 ? topEventOfDay.id : null;

    // Separate regular and collapsible group events
    const regularEvents: GroupedEvent[] = [];
    const collapsibleGroups: Record<string, GroupedEvent[]> = {};
    displayedEvents.forEach(event => {
      const group = getCollapsibleGroup(event);
      if (group) {
        if (!collapsibleGroups[group]) collapsibleGroups[group] = [];
        collapsibleGroups[group].push(event);
      } else {
        regularEvents.push(event);
      }
    });

    return (
      <div key={date} className="mb-4">
        <h3 className="text-sm font-serif text-white/90 mb-2 capitalize">
          {weekday}, {day}. {month}
        </h3>
        <div className="space-y-0">
          {regularEvents.map(e => renderEvent(e, isToday, topEventId))}

          {Object.entries(collapsibleGroups).map(([groupKey, events]) => {
            const groupId = `${date}_${groupKey}`;
            const isGroupExpanded = expandedGroups.has(groupId);
            const { label, img } = GROUP_CONFIG[groupKey];
            const groupEvent: TribeEvent = {
              id: `group_${groupKey}_${date}`,
              date, time: null,
              title: `${label} — ${events.length} Events`,
              event: label, category: groupKey,
              image_url: img, link: '',
              description: events.slice(0, 3).map(e => e.title).join(' · '),
            };

            return (
              <div key={groupKey}>
                <div onClick={() => onToggleGroup(groupId)} className="cursor-pointer">
                  <TribeEventCard event={groupEvent} variant="compact" onInteraction={() => {}} />
                </div>
                {isGroupExpanded && (
                  <div className="space-y-0 pl-3 border-l border-white/[0.06]">
                    {events.map(e => renderEvent(e, isToday, topEventId))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {shouldCollapse && !isExpanded && hiddenCount > 0 && (
          <button
            onClick={() => setExpandedDates(prev => new Set([...prev, date]))}
            className="w-full mt-2 py-2 text-[10px] text-zinc-500 hover:text-gold uppercase tracking-widest border border-dashed border-white/10 hover:border-gold/30 transition-colors flex items-center justify-center gap-2"
          >
            <ChevronDown size={12} />
            +{hiddenCount} weitere Events
            {pastEvents.length > 0 && isToday && ` (${pastEvents.length} bereits vorbei)`}
          </button>
        )}
        {shouldCollapse && isExpanded && (
          <button
            onClick={() => setExpandedDates(prev => { const n = new Set(prev); n.delete(date); return n; })}
            className="w-full mt-2 py-2 text-[10px] text-zinc-500 hover:text-gold uppercase tracking-widest border border-dashed border-white/10 hover:border-gold/30 transition-colors flex items-center justify-center gap-2"
          >
            <ChevronDown size={12} className="rotate-180" />
            Weniger anzeigen
          </button>
        )}
      </div>
    );
  };

  return (
    <div className="mb-2">
      {/* Category Tabs */}
      <div className="px-4 pt-2 pb-3">
        <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
          {CATEGORIES.map((cat) => {
            const isForMe = cat === "FÜR MICH";
            const hasPreferences = (() => {
              const prefs = localStorage.getItem('tribe_preferred_categories');
              return prefs ? JSON.parse(prefs).length > 0 : false;
            })();
            return (
              <button
                key={cat}
                onClick={() => onCategoryChange(cat)}
                className={`text-[10px] font-medium uppercase tracking-wider whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                  selectedCategory === cat
                    ? isForMe ? "text-gold bg-gold/20 px-2 py-0.5 rounded-full" : "text-gold"
                    : "text-zinc-600 hover:text-zinc-400"
                } ${isForMe && !hasPreferences ? "opacity-50" : ""}`}
              >
                {cat}
              </button>
            );
          })}
        </div>

        {/* MIA Filter Indicator */}
        {miaFilteredEventIds && (
          <div className="mt-2 flex justify-between items-center bg-gold/10 border border-gold/30 px-3 py-1.5 rounded-sm animate-fadeIn">
            <div className="flex items-center gap-2">
              <Filter size={10} className="text-gold" />
              <span className="text-[9px] text-gold font-bold uppercase tracking-widest">
                MIA zeigt {miaFilteredEventIds.length} Events
              </span>
            </div>
            <button onClick={onMiaClearFilter} className="text-[9px] text-zinc-400 hover:text-white underline">
              ALLE ANZEIGEN
            </button>
          </div>
        )}
      </div>

      {/* Hero Section - Horizontal Scroll */}
      {spotlightEvents.length > 0 && (
        <div className="mb-3">
          <div className="px-4 mb-3">
            <h2 className="text-[10px] font-extrabold text-white uppercase tracking-[0.25em] flex items-center gap-2">
              <div className="w-4 h-4 rounded-full overflow-hidden">
                <img src={MIA_AVATAR} className="w-full h-full object-cover" alt="MIA" />
              </div>
              MIA Recommendations
            </h2>
          </div>
          <div
            className="flex gap-4 overflow-x-auto no-scrollbar snap-x px-4 pb-3"
            onScroll={onHeroScroll}
          >
            {spotlightEvents.map((event, i) => (
              <div key={`spot-${i}`} className="min-w-[75vw] md:min-w-[340px] snap-center">
                <TribeEventCard
                  event={event}
                  variant="hero"
                  onInteraction={onInteraction}
                  isLiked={likedEventIds.has(event.id)}
                  isAttending={attendingEventIds.has(event.id)}
                  onToggleAttendance={onToggleAttendance}
                  matchScore={eventMatchScores.get(event.id)}
                />
              </div>
            ))}
            {heroLoadedCount < totalFilteredCount && (
              <div className="min-w-[60px] flex items-center justify-center">
                <div className="w-6 h-6 border-2 border-gold/30 border-t-gold rounded-full animate-spin" />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Collapsible Feed Section */}
      <Collapsible open={isFeedOpen} onOpenChange={setIsFeedOpen}>
        <CollapsibleTrigger asChild>
          <button className="w-full px-4 py-2.5 flex items-center justify-between border-y border-white/5 hover:bg-white/[0.02] transition-colors">
            <div className="flex items-center gap-3">
              <span className="text-[10px] font-extrabold text-white uppercase tracking-[0.25em]">
                Your Feed · {feedEvents.length} Events
              </span>
            </div>
            <div className="flex items-center gap-3">
              {/* Map Button */}
              {onViewChange && (
                <button
                  onClick={(e) => { e.stopPropagation(); onViewChange(ViewState.MAP); }}
                  className="flex items-center gap-1 px-2 py-0.5 rounded transition-all"
                  style={{ backgroundColor: '#FFFFFF', color: '#000000' }}
                >
                  <MapIcon size={12} />
                  <span className="text-[9px] font-bold uppercase tracking-wider">Map</span>
                </button>
              )}

              {/* Calendar Picker */}
              <Popover>
                <PopoverTrigger asChild>
                  <button onClick={(e) => e.stopPropagation()} className="text-zinc-500 hover:text-white transition-colors">
                    <CalendarIcon size={14} />
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-zinc-900 border-white/10" align="end">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={(date) => {
                      onDateChange(date || undefined);
                      if (date && onFetchEventsForDate) {
                        onFetchEventsForDate(date);
                      }
                    }}
                    className="pointer-events-auto"
                  />
                  {selectedDate && (
                    <div className="p-3 border-t border-white/10">
                      <button onClick={() => onDateChange(undefined)} className="w-full text-xs text-zinc-400 hover:text-white transition-colors">
                        Filter zurücksetzen
                      </button>
                    </div>
                  )}
                </PopoverContent>
              </Popover>

              <div className="flex items-center gap-1 text-zinc-500">
                <span className="text-[9px] uppercase tracking-wider">
                  {isFeedOpen ? 'Einklappen' : 'Anzeigen'}
                </span>
                <ChevronDown size={14} className={`transition-transform duration-200 ${isFeedOpen ? 'rotate-180' : ''}`} />
              </div>
            </div>
          </button>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="px-4 space-y-0 pb-4 max-h-[60vh] overflow-y-auto">
            {sortedDates.length > 0 ? (
              sortedDates.map(date => renderDateSection(date))
            ) : (
              <div className="py-6 text-center text-zinc-600 font-light text-sm">Keine Events gefunden.</div>
            )}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
};
