import React from 'react';
import { TribeEvent } from '@/types/tribe';
import { Calendar, MapPin, Music, Dumbbell, Palette, PartyPopper, Users, ChevronRight } from 'lucide-react';

interface MiaEventCardProps {
  event: TribeEvent;
  onView: (id: string) => void;
  showMatchScore?: boolean;
}

const CATEGORY_CONFIG: Record<string, { icon: React.ReactNode; label: string; gradient: string }> = {
  musik: { icon: <Music size={10} />, label: 'Musik', gradient: 'from-purple-500/30 to-purple-900/20' },
  music: { icon: <Music size={10} />, label: 'Music', gradient: 'from-purple-500/30 to-purple-900/20' },
  konzert: { icon: <Music size={10} />, label: 'Konzert', gradient: 'from-purple-500/30 to-purple-900/20' },
  sport: { icon: <Dumbbell size={10} />, label: 'Sport', gradient: 'from-emerald-500/30 to-emerald-900/20' },
  kunst: { icon: <Palette size={10} />, label: 'Kunst', gradient: 'from-amber-500/30 to-amber-900/20' },
  art: { icon: <Palette size={10} />, label: 'Art', gradient: 'from-amber-500/30 to-amber-900/20' },
  party: { icon: <PartyPopper size={10} />, label: 'Party', gradient: 'from-pink-500/30 to-pink-900/20' },
  community: { icon: <Users size={10} />, label: 'Community', gradient: 'from-sky-500/30 to-sky-900/20' },
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
      className={`group flex gap-3 p-2.5 rounded-xl text-left w-full relative overflow-hidden transition-all duration-200 ${
        isTribe
          ? 'bg-gradient-to-r from-gold/10 to-transparent border border-gold/25 hover:border-gold/50'
          : 'bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.06] hover:border-white/10'
      }`}
    >
      {/* Match Score Badge */}
      {showMatchScore && event.matchScore != null && event.matchScore > 0 && (
        <div className="absolute top-1.5 right-1.5 px-2 py-0.5 bg-gradient-to-r from-gold to-gold-light rounded-full text-[9px] font-bold text-black tracking-wide shadow-lg shadow-gold/20">
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
          <div className={`w-14 h-14 rounded-lg bg-gradient-to-br ${catConfig?.gradient || 'from-zinc-700/50 to-zinc-800/50'} flex items-center justify-center`}>
            {catConfig?.icon ? (
              <span className="text-white/60 scale-150">{catConfig.icon}</span>
            ) : (
              <Calendar size={16} className="text-white/30" />
            )}
          </div>
        )}
        {isTribe && (
          <div className="absolute -bottom-0.5 -right-0.5 px-1 py-px bg-gold rounded text-[7px] font-bold text-black tracking-wider">
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
        <ChevronRight size={14} className="text-white/20 group-hover:text-gold transition-colors" />
      </div>
    </button>
  );
};
