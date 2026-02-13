import React from 'react';
import { TribeEvent } from '@/types/tribe';
import { Calendar, MapPin, Music, Dumbbell, Palette, PartyPopper, Users, ChevronRight } from 'lucide-react';

interface MiaEventCardProps {
  event: TribeEvent;
  onView: (id: string) => void;
  showMatchScore?: boolean;
}

const CATEGORY_CONFIG: Record<string, { icon: React.ReactNode; label: string }> = {
  musik: { icon: <Music size={10} />, label: 'Musik' },
  music: { icon: <Music size={10} />, label: 'Music' },
  konzert: { icon: <Music size={10} />, label: 'Konzert' },
  sport: { icon: <Dumbbell size={10} />, label: 'Sport' },
  kunst: { icon: <Palette size={10} />, label: 'Kunst' },
  art: { icon: <Palette size={10} />, label: 'Art' },
  party: { icon: <PartyPopper size={10} />, label: 'Party' },
  community: { icon: <Users size={10} />, label: 'Community' },
};

const getCategoryConfig = (category?: string) => {
  if (!category) return null;
  const key = category.toLowerCase();
  for (const [k, v] of Object.entries(CATEGORY_CONFIG)) {
    if (key.includes(k)) return { ...v, key: k };
  }
  return null;
};

const formatDate = (dateStr: string) => {
  try {
    const d = new Date(dateStr);
    const days = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];
    return `${days[d.getDay()]} ${d.getDate().toString().padStart(2, '0')}.${(d.getMonth() + 1).toString().padStart(2, '0')}`;
  } catch {
    return dateStr;
  }
};

export const MiaEventCard: React.FC<MiaEventCardProps> = ({ event, onView, showMatchScore }) => {
  const catConfig = getCategoryConfig(event.category);
  const isTribe = event.source === 'community';

  return (
    <button
      onClick={() => onView(event.id)}
      className="group flex gap-3 p-2.5 rounded-xl text-left w-full relative overflow-hidden transition-all duration-200 bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.06] hover:border-white/10"
    >
      {/* Match Score Badge */}
      {showMatchScore && event.matchScore != null && event.matchScore > 0 && (
        <div className="absolute top-1.5 right-1.5 px-2 py-0.5 bg-white/10 border border-white/15 rounded-full text-[9px] font-bold text-white/70 tracking-wide">
          {event.matchScore}%
        </div>
      )}

      {/* Thumbnail */}
      <div className="relative shrink-0">
        {event.image_url ? (
          <img
            src={event.image_url}
            alt=""
            className="w-14 h-14 rounded-lg object-cover"
          />
        ) : (
          <div className="w-14 h-14 rounded-lg bg-white/[0.04] border border-white/[0.06] flex items-center justify-center">
            {catConfig?.icon ? (
              <span className="text-white/40 scale-150">{catConfig.icon}</span>
            ) : (
              <Calendar size={16} className="text-white/30" />
            )}
          </div>
        )}
        {isTribe && (
          <div className="absolute -bottom-0.5 -right-0.5 px-1 py-px bg-white/80 rounded text-[7px] font-bold text-black tracking-wider">
            TRIBE
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0 py-0.5">
        <p className="text-[13px] font-medium text-white/90 line-clamp-1 leading-tight tracking-tight">{event.title}</p>
        <div className="flex items-center gap-3 mt-1.5">
          <div className="flex items-center gap-1 text-[10px] text-white/40">
            <Calendar size={9} className="shrink-0" />
            <span>{formatDate(event.date)}{event.time ? ` · ${event.time}` : ''}</span>
          </div>
          {event.location && (
            <div className="flex items-center gap-1 text-[10px] text-white/30">
              <MapPin size={9} className="shrink-0" />
              <span className="truncate max-w-[100px]">{event.location}</span>
            </div>
          )}
        </div>
      </div>

      {/* Arrow */}
      <div className="flex items-center shrink-0 self-center">
        <ChevronRight size={14} className="text-white/20 group-hover:text-white/60 transition-colors" />
      </div>
    </button>
  );
};
