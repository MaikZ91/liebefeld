import React from 'react';
import { TribeEvent } from '@/types/tribe';
import { Calendar, MapPin, Music, Dumbbell, Palette, PartyPopper, Users } from 'lucide-react';

interface MiaEventCardProps {
  event: TribeEvent;
  onView: (id: string) => void;
  showMatchScore?: boolean;
}

const CATEGORY_CONFIG: Record<string, { icon: React.ReactNode; color: string; bg: string }> = {
  musik: { icon: <Music size={10} />, color: 'text-purple-300', bg: 'bg-purple-500/20 border-purple-500/30' },
  music: { icon: <Music size={10} />, color: 'text-purple-300', bg: 'bg-purple-500/20 border-purple-500/30' },
  konzert: { icon: <Music size={10} />, color: 'text-purple-300', bg: 'bg-purple-500/20 border-purple-500/30' },
  sport: { icon: <Dumbbell size={10} />, color: 'text-emerald-300', bg: 'bg-emerald-500/20 border-emerald-500/30' },
  kunst: { icon: <Palette size={10} />, color: 'text-amber-300', bg: 'bg-amber-500/20 border-amber-500/30' },
  art: { icon: <Palette size={10} />, color: 'text-amber-300', bg: 'bg-amber-500/20 border-amber-500/30' },
  party: { icon: <PartyPopper size={10} />, color: 'text-pink-300', bg: 'bg-pink-500/20 border-pink-500/30' },
  community: { icon: <Users size={10} />, color: 'text-sky-300', bg: 'bg-sky-500/20 border-sky-500/30' },
};

const getCategoryConfig = (category?: string) => {
  if (!category) return null;
  const key = category.toLowerCase();
  for (const [k, v] of Object.entries(CATEGORY_CONFIG)) {
    if (key.includes(k)) return v;
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

  return (
    <button
      onClick={() => onView(event.id)}
      className="flex gap-3 p-2.5 bg-zinc-800/50 border border-white/10 rounded-xl hover:border-gold/30 transition-colors text-left w-full relative"
    >
      {/* Match Score Badge */}
      {showMatchScore && event.matchScore != null && event.matchScore > 0 && (
        <div className="absolute -top-1.5 -right-1.5 px-1.5 py-0.5 bg-gold/90 rounded-full text-[9px] font-bold text-zinc-950 shadow-sm">
          {event.matchScore}% Match
        </div>
      )}
      {/* Thumbnail */}
      {event.image_url ? (
        <img
          src={event.image_url}
          alt=""
          className="w-12 h-12 rounded-lg object-cover shrink-0"
        />
      ) : (
        <div className="w-12 h-12 rounded-lg shrink-0 bg-gradient-to-br from-zinc-700 to-zinc-800 flex items-center justify-center">
          {catConfig?.icon ? (
            <span className={catConfig.color}>{catConfig.icon}</span>
          ) : (
            <Calendar size={14} className="text-zinc-500" />
          )}
        </div>
      )}

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-white/90 line-clamp-2 leading-tight">{event.title}</p>
        <div className="flex items-center gap-1.5 mt-1 text-[10px] text-zinc-400">
          <Calendar size={9} className="shrink-0" />
          <span>{formatDate(event.date)}{event.time ? ` · ${event.time}` : ''}</span>
        </div>
        {event.location && (
          <div className="flex items-center gap-1.5 mt-0.5 text-[10px] text-zinc-500">
            <MapPin size={9} className="shrink-0" />
            <span className="truncate">{event.location}</span>
          </div>
        )}
        <div className="flex items-center gap-2 mt-1.5">
          {catConfig && (
            <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-medium border ${catConfig.bg} ${catConfig.color}`}>
              {catConfig.icon}
              {event.category}
            </span>
          )}
          <span className="text-[10px] text-gold font-medium ml-auto">Ansehen →</span>
        </div>
      </div>
    </button>
  );
};
