import React, { useState } from 'react';
import { TribeEvent } from '@/types/tribe';
import { generateEventSummary } from '@/services/tribe/aiHelpers';
import { Sparkles, Users, Share2, X, Heart, Check } from 'lucide-react';

interface EventCardProps {
  event: TribeEvent;
  variant?: 'hero' | 'standard' | 'compact';
  onJoinTribe?: (eventName: string) => void;
  onInteraction?: (eventId: string, type: 'like' | 'dislike') => void;
  isLiked?: boolean;
  isAttending?: boolean;
  onToggleAttendance?: (eventId: string) => void;
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

export const TribeEventCard: React.FC<EventCardProps> = ({ 
  event, 
  variant = 'standard', 
  onJoinTribe,
  onInteraction,
  isLiked = false,
  isAttending = false,
  onToggleAttendance
}) => {
  const [summary, setSummary] = useState<string | null>(null);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | null>(null);
  
  const displayImage = event.image_url;

  // Mock Attendees Data
  const baseCount = event.attendees || Math.floor(Math.random() * 80) + 12;
  const currentAttendees = isAttending ? baseCount + 1 : baseCount;
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

  const handleInteractionClick = (type: 'like' | 'dislike', e: React.MouseEvent) => {
    e.stopPropagation();
    if (type === 'dislike') {
      setSwipeDirection('left');
    }
    if (onInteraction) {
      onInteraction(event.id, type);
    }
  };

  const handleToggleGoingClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onToggleAttendance) {
      onToggleAttendance(event.id);
    }
  };

  const animationClass = swipeDirection === 'left' 
    ? 'translate-x-[-100%] opacity-0 rotate-[-10deg]' 
    : '';

  // --- COMPACT VARIANT (List Compact) ---
  if (variant === 'compact') {
    return (
      <div className={`flex items-center gap-4 bg-black border-b border-white/5 py-3 transition-all duration-500 ${animationClass}`}>
        {/* Thumbnail */}
        <div className="w-16 h-20 bg-zinc-900 flex-shrink-0 relative overflow-hidden">
          {displayImage ? (
            <img src={displayImage} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-zinc-800">
              <span className="text-[8px] text-zinc-600">NO IMG</span>
            </div>
          )}
          {isLiked && (
            <div className="absolute top-0.5 left-0.5 bg-gold text-black text-[7px] font-bold px-1 py-0.5 uppercase">★</div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-center">
            <h3 className={`text-sm font-medium truncate ${isLiked ? 'text-gold' : 'text-white'}`}>{event.title}</h3>
            <span className="text-[10px] text-zinc-500 font-mono">{formatTime(event.time)}</span>
          </div>
          <div className="flex justify-between items-center mt-1">
            <p className="text-[10px] text-zinc-500 uppercase tracking-wide truncate">
              {event.location ? <span className="text-zinc-300 font-medium">{event.location}, </span> : ''}
              {formatEventDate(event.date)}
            </p>
            <div className="flex items-center gap-1">
              <Users size={10} className={isAttending ? "text-gold" : "text-zinc-600"} />
              <span className={`text-[9px] ${isAttending ? "text-gold font-bold" : "text-zinc-500"}`}>{currentAttendees}</span>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex gap-2 pl-2 border-l border-white/5">
          <button 
            onClick={(e) => handleInteractionClick('dislike', e)}
            className="p-1.5 text-zinc-600 hover:text-red-500 hover:bg-white/5 rounded-full transition-colors"
          >
            <X size={14} />
          </button>
          <button 
            onClick={(e) => handleInteractionClick('like', e)}
            className={`p-1.5 rounded-full transition-colors ${isLiked ? 'text-gold bg-gold/10' : 'text-zinc-600 hover:text-gold hover:bg-white/5'}`}
          >
            <Heart size={14} fill={isLiked ? "currentColor" : "none"} />
          </button>
        </div>
      </div>
    );
  }

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
    <div className={`bg-black border-b border-white/5 pb-6 mb-2 transition-all duration-500 ${animationClass}`}>
        {/* Main Card Content */}
        <div className="flex gap-5 items-start cursor-pointer group relative">
            
            {/* TINDER ACTIONS OVERLAY */}
            <div className="absolute right-0 top-0 flex flex-col gap-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity p-2">
              <button 
                onClick={(e) => handleInteractionClick('dislike', e)}
                className="w-8 h-8 rounded-full bg-black/80 border border-zinc-700 flex items-center justify-center text-zinc-400 hover:text-white"
              >
                <X size={14} />
              </button>
              <button 
                onClick={(e) => handleInteractionClick('like', e)}
                className={`w-8 h-8 rounded-full bg-black/80 border flex items-center justify-center transition-colors ${isLiked ? 'border-gold text-gold bg-black' : 'border-zinc-700 text-zinc-400 hover:border-gold hover:text-gold'}`}
              >
                <Heart size={14} fill={isLiked ? "currentColor" : "none"} />
              </button>
            </div>

            {/* Thumbnail */}
            <div className="w-24 h-32 bg-zinc-900 flex-shrink-0 relative overflow-hidden">
                {displayImage ? (
                    <img src={displayImage} className="w-full h-full object-cover grayscale-0 group-hover:scale-105 transition-transform duration-700" />
                ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-zinc-800">
                         <span className="text-[9px] text-zinc-600 uppercase">No Img</span>
                    </div>
                )}
                {isLiked && (
                  <div className="absolute top-1 left-1 bg-gold text-black text-[8px] font-bold px-1.5 py-0.5 uppercase tracking-wide">
                    Liked
                  </div>
                )}
            </div>
            
            {/* Info */}
            <div className="flex-1 min-w-0 pt-1">
                <div className="flex justify-between items-start mb-2">
                    <span className="text-[11px] text-gold font-medium uppercase tracking-widest">{formatEventDate(event.date)} • {formatTime(event.time)}</span>
                    <button onClick={(e) => { e.stopPropagation(); }} className="text-zinc-500 hover:text-white transition-colors"><Share2 size={16} strokeWidth={1.5} /></button>
                </div>
                <h3 className={`text-xl font-normal leading-tight mb-1 truncate ${isLiked ? 'text-gold' : 'text-white'}`}>
                    {event.title}
                </h3>
                <p className="text-sm text-zinc-500 font-light mb-4 truncate">
                  {event.location ? <span className="text-white font-medium">{event.location}, </span> : ''}
                  {event.city}
                </p>
                
                {/* Community Section */}
                <div className="flex items-center justify-between">
                     <div className="flex items-center gap-3">
                        <div className="flex -space-x-3">
                            {isAttending && (
                              <div className="w-7 h-7 rounded-full border-2 border-gold bg-black flex items-center justify-center relative z-10">
                                <Check size={14} className="text-gold" />
                              </div>
                            )}
                            {mockAvatars.map((url, i) => (
                                <img key={i} src={url} className="w-7 h-7 rounded-full border-2 border-surface object-cover grayscale" />
                            ))}
                        </div>
                        <span className={`text-xs font-light ${isAttending ? "text-gold" : "text-zinc-400"}`}>
                            +{currentAttendees} <span className="hidden sm:inline">going</span>
                        </span>
                    </div>
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
                    onClick={handleToggleGoingClick}
                    className={`h-9 px-4 flex items-center justify-center gap-2 text-xs font-bold tracking-wide transition-colors border ${isAttending ? 'bg-gold text-black border-gold' : 'bg-transparent text-gold border-gold/30 hover:bg-gold/10'}`}
                >
                    {isAttending ? <><Check size={14} /> GOING</> : 'RSVP'}
                </button>

                <button 
                    onClick={() => onJoinTribe && onJoinTribe(event.title)}
                    className="h-9 flex-1 flex items-center justify-center gap-2 bg-white hover:bg-zinc-200 text-black text-[11px] font-bold tracking-wide transition-colors whitespace-nowrap"
                >
                    Join Tribe
                </button>
                </>
            )}
        </div>
    </div>
  );
};