import React, { useState } from 'react';
import { TribeEvent } from '@/types/tribe';
import { generateEventSummary } from '@/services/tribe/aiHelpers';
import { Sparkles, Users, Share2, Info, ArrowRight, UserPlus } from 'lucide-react';

interface EventCardProps {
  event: TribeEvent;
  variant?: 'hero' | 'standard';
  onJoinCrew?: (eventName: string) => void;
}

// Helper functions for date/time formatting
const formatEventDate = (dateStr: string, includeYear = false) => {
  const date = new Date(dateStr);
  const weekday = date.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase();
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  if (includeYear) {
    return `${weekday.slice(0,2)}, ${day}.${month}.${date.getFullYear()}`;
  }
  return `${weekday}, ${day}.${month}`;
};

const formatTime = (timeStr?: string | null) => {
  if (!timeStr) return '23:00';
  return timeStr;
};

export const TribeEventCard: React.FC<EventCardProps> = ({ event, variant = 'standard', onJoinCrew }) => {
  const [summary, setSummary] = useState<string | null>(null);
  const [loadingSummary, setLoadingSummary] = useState(false);
  
  const displayImage = event.image_url;

  // Mock Attendees Data
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
        <div className="w-full cursor-pointer relative group overflow-hidden bg-black">
            <div className="aspect-[16/9] w-full relative">
                {displayImage ? (
                    <img src={displayImage} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105" />
                ) : (
                    <div className="w-full h-full flex items-center justify-center bg-zinc-900 relative">
                        <span className="text-gold text-[10px] uppercase tracking-widest relative z-10 border border-gold/30 px-3 py-1">No Image</span>
                    </div>
                )}
                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent opacity-90"></div>
                
                <div className="absolute bottom-5 left-5 right-5">
                    <div className="flex items-center gap-3 mb-2">
                         <span className="bg-black text-gold px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest">{formatEventDate(event.date, true)}</span>
                         {event.category && <span className="text-zinc-300 text-[10px] uppercase tracking-widest">{event.category}</span>}
                    </div>
                    <h2 className="text-2xl font-light text-white leading-none mb-2">{event.title}</h2>
                    <p className="text-zinc-400 text-xs font-light">{event.city}</p>
                </div>
            </div>
        </div>
    );
  }

  // --- STANDARD VARIANT (List) ---
  return (
    <div className="bg-black border-b border-white/5 pb-6 mb-2">
        {/* Main Card Content */}
        <div className="flex gap-5 items-start cursor-pointer group">
            {/* Thumbnail */}
            <div className="w-24 h-32 bg-zinc-900 flex-shrink-0 relative overflow-hidden">
                {displayImage ? (
                    <img src={displayImage} className="w-full h-full object-cover grayscale-0 group-hover:scale-105 transition-transform duration-700" />
                ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-zinc-800">
                         <span className="text-[9px] text-zinc-600 uppercase">No Img</span>
                    </div>
                )}
            </div>
            
            {/* Info */}
            <div className="flex-1 min-w-0 pt-1">
                <div className="flex justify-between items-start mb-2">
                    <span className="text-[11px] text-gold font-medium uppercase tracking-widest">{formatEventDate(event.date)} • {formatTime(event.time)}</span>
                    <button className="text-zinc-500 hover:text-white transition-colors"><Share2 size={16} strokeWidth={1.5} /></button>
                </div>
                <h3 className="text-xl text-white font-normal leading-tight mb-1 truncate">
                    {event.title}
                </h3>
                <p className="text-sm text-zinc-500 font-light mb-4 truncate">{event.city}</p>
                
                {/* Community Section */}
                <div className="flex items-center justify-between">
                     <div className="flex items-center gap-3">
                        <div className="flex -space-x-3">
                            {mockAvatars.map((url, i) => (
                                <img key={i} src={url} className="w-7 h-7 rounded-full border-2 border-surface object-cover grayscale" />
                            ))}
                        </div>
                        <span className="text-xs text-zinc-400 font-light">
                            +{attendeeCount} <span className="hidden sm:inline">going</span>
                        </span>
                    </div>
                </div>
            </div>
        </div>

        {/* Action Bar */}
        <div className="mt-4 flex gap-3 pl-[7.25rem]"> {/* Align with text, offset image width + gap */}
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
                    onClick={() => onJoinCrew && onJoinCrew(event.title)}
                    className="h-9 flex-1 flex items-center justify-center gap-2 bg-white hover:bg-zinc-200 text-black text-xs font-bold tracking-wide transition-colors"
                >
                    Join Crew
                </button>
                </>
            )}
        </div>
    </div>
  );
};
