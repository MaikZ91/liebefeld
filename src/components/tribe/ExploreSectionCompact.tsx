import React, { useState } from 'react';
import { TribeEvent, UserProfile } from '@/types/tribe';
import { GroupedEvent } from '@/utils/tribe/eventGrouping';
import { TribeEventCard } from './TribeEventCard';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

const MIA_AVATAR = "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150&h=150";

interface ExploreSectionCompactProps {
  spotlightEvents: GroupedEvent[];
  feedEvents: GroupedEvent[];
  likedEventIds: Set<string>;
  attendingEventIds: Set<string>;
  eventMatchScores: Map<string, number>;
  onInteraction: (eventId: string, type: 'like' | 'dislike') => void;
  onToggleAttendance: (eventId: string) => void;
  onHeroScroll?: (e: React.UIEvent<HTMLDivElement>) => void;
  heroLoadedCount?: number;
  totalFilteredCount?: number;
}

export const ExploreSectionCompact: React.FC<ExploreSectionCompactProps> = ({
  spotlightEvents,
  feedEvents,
  likedEventIds,
  attendingEventIds,
  eventMatchScores,
  onInteraction,
  onToggleAttendance,
  onHeroScroll,
  heroLoadedCount = 10,
  totalFilteredCount = 0,
}) => {
  const [isFeedOpen, setIsFeedOpen] = useState(false);
  const MAX_FEED_PREVIEW = 5;

  if (spotlightEvents.length === 0 && feedEvents.length === 0) return null;

  return (
    <div className="mb-4">
      {/* Hero Section - Horizontal Scroll */}
      {spotlightEvents.length > 0 && (
        <div className="mb-3">
          <div className="px-4 mb-3">
            <h2 className="text-[10px] font-extrabold text-white uppercase tracking-[0.25em] flex items-center gap-2">
              <div className="w-4 h-4 rounded-full overflow-hidden">
                <img src={MIA_AVATAR} className="w-full h-full object-cover" alt="MIA" />
              </div>
              Highlights
            </h2>
          </div>
          <div 
            className="flex gap-3 overflow-x-auto no-scrollbar snap-x px-4 pb-3"
            onScroll={onHeroScroll}
          >
            {spotlightEvents.slice(0, 6).map((event, i) => (
              <div key={`spot-${i}`} className="min-w-[65vw] md:min-w-[280px] snap-center">
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
          </div>
        </div>
      )}

      {/* Collapsible Feed List */}
      {feedEvents.length > 0 && (
        <Collapsible open={isFeedOpen} onOpenChange={setIsFeedOpen}>
          <CollapsibleTrigger asChild>
            <button className="w-full px-4 py-2 flex items-center justify-between border-y border-white/5 hover:bg-white/[0.02] transition-colors">
              <span className="text-[10px] font-extrabold text-white uppercase tracking-[0.25em]">
                Upcoming · {feedEvents.length} Events
              </span>
              <div className="flex items-center gap-1.5 text-zinc-500">
                <span className="text-[9px] uppercase tracking-wider">
                  {isFeedOpen ? 'Einklappen' : 'Alle anzeigen'}
                </span>
                {isFeedOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </div>
            </button>
          </CollapsibleTrigger>

          {/* Preview: show first few events always */}
          {!isFeedOpen && (
            <div className="px-4 space-y-0">
              {feedEvents.slice(0, 3).map((event) => (
                <TribeEventCard
                  key={event.id}
                  event={event}
                  variant="compact"
                  onInteraction={onInteraction}
                  isLiked={likedEventIds.has(event.id)}
                  isAttending={attendingEventIds.has(event.id)}
                  onToggleAttendance={onToggleAttendance}
                  matchScore={eventMatchScores.get(event.id)}
                />
              ))}
            </div>
          )}

          <CollapsibleContent>
            <div className="px-4 space-y-0 max-h-[50vh] overflow-y-auto">
              {feedEvents.map((event) => (
                <TribeEventCard
                  key={event.id}
                  event={event}
                  variant="compact"
                  onInteraction={onInteraction}
                  isLiked={likedEventIds.has(event.id)}
                  isAttending={attendingEventIds.has(event.id)}
                  onToggleAttendance={onToggleAttendance}
                  matchScore={eventMatchScores.get(event.id)}
                />
              ))}
            </div>
          </CollapsibleContent>
        </Collapsible>
      )}
    </div>
  );
};
