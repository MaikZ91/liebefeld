import React, { useState } from 'react';
import { TribeEvent } from '@/types/tribe';
import { generateEventSummary } from '@/services/tribe/aiHelpers';
import { Sparkles, Users, UserPlus } from 'lucide-react';

interface TribeEventCardProps {
  event: TribeEvent;
  variant?: 'hero' | 'standard';
  onJoinCrew?: (eventName: string) => void;
  onClick?: () => void;
}

export const TribeEventCard: React.FC<TribeEventCardProps> = ({ 
  event, 
  variant = 'standard',
  onJoinCrew,
  onClick 
}) => {
  const [summary, setSummary] = useState<string | null>(null);
  const [loadingSummary, setLoadingSummary] = useState(false);
  
  const displayImage = event.image_url;
  const attendeeCount = event.attendees || Math.floor(Math.random() * 80) + 12;
  const mockAvatars = [
    "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=64&h=64&fit=crop",
    "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=64&h=64&fit=crop",
    "https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=64&h=64&fit=crop"
  ];

  const handleGetSummary = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (summary) return;
    setLoadingSummary(true);
    const aiSummary = await generateEventSummary(event);
    setSummary(aiSummary);
    setLoadingSummary(false);
  };

  // --- HERO VARIANT (Spotlight) ---
  if (variant === 'hero') {
    return (
      <div className="w-full cursor-pointer relative group overflow-hidden bg-black" onClick={onClick}>
        <div className="aspect-[16/9] w-full relative">
          {displayImage ? (
            <img src={displayImage} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105" alt={event.title} />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-zinc-900 relative">
              <span className="text-gold text-[10px] uppercase tracking-widest relative z-10 border border-gold/30 px-3 py-1">Tap to Load Visual</span>
            </div>
          )}
          
          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent opacity-90"></div>
          
          <div className="absolute bottom-5 left-5 right-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="flex -space-x-1.5">
                {mockAvatars.map((avatar, i) => (
                  <img key={i} src={avatar} alt="" className="w-7 h-7 rounded-full border border-black" />
                ))}
              </div>
              <span className="text-white text-xs font-light">
                +{attendeeCount - 3} going
              </span>
            </div>
            
            <h3 className="text-white text-xl font-light tracking-tight mb-1">{event.title}</h3>
            <p className="text-zinc-400 text-sm font-light">{event.date} · {event.time || 'TBA'}</p>
            
            {event.matchScore && event.matchScore > 70 && (
              <div className="mt-3 inline-flex items-center gap-1.5 bg-gold/20 text-gold px-2 py-1 text-[10px] font-bold uppercase tracking-widest border border-gold/30">
                <Sparkles size={12} />
                {event.matchScore}% Match
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // --- STANDARD VARIANT ---
  return (
    <div className="cursor-pointer relative group bg-black" onClick={onClick}>
      <div className="flex gap-4">
        {/* Image */}
        <div className="w-28 h-28 flex-shrink-0 relative overflow-hidden">
          {displayImage ? (
            <img src={displayImage} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" alt={event.title} />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-zinc-900">
              <span className="text-gold text-[9px] uppercase tracking-widest">No Image</span>
            </div>
          )}
        </div>
        
        {/* Content */}
        <div className="flex-1 min-w-0 py-1">
          <div className="mb-1">
            <h4 className="text-white text-base font-light tracking-tight line-clamp-2 group-hover:text-gold transition-colors">{event.title}</h4>
          </div>
          
          <p className="text-zinc-500 text-xs font-light mb-2">{event.date} · {event.time || 'TBA'}</p>
          
          <div className="flex items-center gap-2 text-zinc-600 text-xs">
            <div className="flex items-center gap-1">
              <Users size={12} />
              <span>{attendeeCount}</span>
            </div>
            {event.matchScore && event.matchScore > 60 && (
              <div className="flex items-center gap-1 text-gold">
                <Sparkles size={12} />
                <span>{event.matchScore}%</span>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Action Bar */}
      <div className="mt-4 flex gap-3 pl-[7.25rem]">
        {summary ? (
          <div className="bg-zinc-900/50 p-3 border-l border-gold animate-fadeIn w-full">
            <p className="text-sm text-zinc-300 font-light leading-relaxed">"{summary}"</p>
          </div>
        ) : (
          <>
            <button 
              onClick={handleGetSummary}
              disabled={loadingSummary}
              className="h-9 px-4 flex items-center justify-center gap-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-xs font-medium tracking-wide transition-colors border border-white/5"
            >
              {loadingSummary ? <span className="animate-pulse">Checking...</span> : <><Sparkles size={14} className="text-gold" /> Vibe Check</>}
            </button>
            
            <button 
              onClick={(e) => {
                e.stopPropagation();
                onJoinCrew && onJoinCrew(event.title);
              }}
              className="h-9 flex-1 flex items-center justify-center gap-2 bg-white hover:bg-zinc-200 text-black text-xs font-bold tracking-wide transition-colors"
            >
              <UserPlus size={14} />
              Join Crew
            </button>
          </>
        )}
      </div>
    </div>
  );
};
