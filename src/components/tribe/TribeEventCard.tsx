import React, { useState } from 'react';
import { TribeEvent } from '@/types/tribe';
import { generateEventSummary } from '@/services/tribe/aiHelpers';
import { getVibeBadgeColor } from '@/utils/tribe/eventHelpers';
import { Sparkles, Users, Share2, X, Heart, Check, ExternalLink } from 'lucide-react';

interface EventCardProps {
  event: TribeEvent;
  variant?: 'hero' | 'standard' | 'compact';
  onJoinTribe?: (eventName: string) => void;
  onInteraction?: (eventId: string, type: 'like' | 'dislike') => void;
  isLiked?: boolean;
  isAttending?: boolean;
  onToggleAttendance?: (eventId: string) => void;
  matchScore?: number; // MIA matching score 0-100%
  isPast?: boolean; // Event has already passed (time-based)
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
  onToggleAttendance,
  matchScore,
  isPast = false
}) => {
  const [summary, setSummary] = useState<string | null>(null);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  
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
      if (summary) {
        // Toggle expanded view when clicking on already loaded summary
        setIsExpanded(!isExpanded);
        return;
      }
      setLoadingSummary(true);
      setIsExpanded(true); // Expand image when loading
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
      <div className={`bg-black border-b border-white/5 transition-all duration-500 ${animationClass} ${isPast ? 'opacity-40 grayscale' : ''}`}>
        <div className={`flex items-start gap-2.5 py-2 transition-all duration-300 ${isExpanded ? 'flex-col' : ''}`}>
          {/* Thumbnail - Expands when Vibe is clicked */}
          <div className={`bg-zinc-900 flex-shrink-0 relative overflow-hidden rounded transition-all duration-300 ${
            isExpanded ? 'w-full aspect-video' : 'w-12 h-14'
          }`}>
            {displayImage ? (
              <img src={displayImage} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-zinc-800">
                <span className="text-[7px] text-zinc-700">?</span>
              </div>
            )}
            {matchScore !== undefined && !isExpanded && (
              <div className="absolute bottom-0 left-0 right-0 bg-black/80 text-gold text-[7px] font-bold px-1 py-0.5 text-center">
                {matchScore}%
              </div>
            )}
            {isExpanded && matchScore !== undefined && (
              <div className="absolute top-2 left-2 bg-gold text-black text-[9px] font-bold px-2 py-0.5">
                {matchScore}%
              </div>
            )}
            {isPast && !isExpanded && (
              <div className="absolute top-0 left-0 right-0 bg-zinc-700/90 text-zinc-300 text-[6px] font-bold px-1 py-0.5 text-center uppercase tracking-wider">
                Vorbei
              </div>
            )}
            {isLiked && !isPast && !isExpanded && (
              <div className="absolute top-0 left-0 right-0 bg-gold/90 text-black text-[6px] font-bold px-1 py-0.5 text-center">
                ★
              </div>
            )}
          </div>

          {/* Info - Full width when expanded */}
          <div className={`min-w-0 ${isExpanded ? 'w-full px-1' : 'flex-1'}`}>
            <h3 className={`font-medium leading-tight ${isLiked ? 'text-gold' : 'text-white'} ${isExpanded ? 'text-sm mb-1' : 'text-xs truncate'}`}>
              {event.title}
            </h3>
            <div className="flex items-center gap-1.5 text-[10px] text-zinc-500 mt-0.5">
              <span className="font-mono">{formatTime(event.time)}</span>
              {event.location && (
                <>
                  <span className="text-zinc-700">•</span>
                  <span className={`text-zinc-400 ${isExpanded ? '' : 'truncate'}`}>{event.location}</span>
                </>
              )}
            </div>
            {/* Attendees under location */}
            <div className="flex items-center gap-1 mt-1">
              <div className="flex -space-x-1.5">
                {isAttending && (
                  <div className="w-4 h-4 rounded-full border border-black bg-gold flex items-center justify-center">
                    <Check size={8} className="text-black" />
                  </div>
                )}
                {mockAvatars.slice(0, 2).map((url, i) => (
                  <img key={i} src={url} className="w-4 h-4 rounded-full border border-black object-cover" />
                ))}
              </div>
              <span className={`text-[9px] ${isAttending ? "text-gold font-bold" : "text-zinc-500"}`}>
                +{currentAttendees}
              </span>
            </div>
          </div>

          {/* Quick Actions - Minimal */}
          {!isExpanded && (
            <div className="flex gap-1.5 flex-shrink-0">
              <button 
                onClick={handleGetSummary}
                disabled={loadingSummary}
                className={`p-1 transition-colors ${summary ? 'text-gold' : 'text-zinc-600 hover:text-gold'}`}
                title="Get Vibe"
              >
                {loadingSummary ? (
                  <div className="w-3 h-3 border border-zinc-600 border-t-gold rounded-full animate-spin" />
                ) : (
                  <Sparkles size={12} fill={summary ? "currentColor" : "none"} />
                )}
              </button>
              <button 
                onClick={(e) => handleInteractionClick('dislike', e)}
                className="p-1 text-zinc-600 hover:text-red-500 transition-colors"
              >
                <X size={12} />
              </button>
              <button 
                onClick={(e) => handleInteractionClick('like', e)}
                className={`p-1 transition-colors ${isLiked ? 'text-gold' : 'text-zinc-600 hover:text-gold'}`}
              >
                <Heart size={12} fill={isLiked ? "currentColor" : "none"} />
              </button>
            </div>
          )}
        </div>

        {/* AI Summary - Shown when expanded */}
        {isExpanded && (
          <div className="px-1 pb-2 animate-fadeIn">
            <div className="bg-zinc-900/50 border-l-2 border-gold px-2 py-1.5 relative mb-2">
              {loadingSummary ? (
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 border border-zinc-600 border-t-gold rounded-full animate-spin" />
                  <span className="text-[10px] text-zinc-500">Loading Vibe...</span>
                </div>
              ) : summary ? (
                <div>
                  <p className="text-[10px] text-zinc-300 leading-relaxed pr-4 mb-1.5">"{summary}"</p>
                  {event.link && (
                    <a 
                      href={event.link} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="inline-flex items-center gap-1 text-[9px] text-zinc-500 hover:text-gold transition-colors"
                    >
                      <ExternalLink size={8} />
                      Mehr erfahren
                    </a>
                  )}
                </div>
              ) : null}
            </div>
            {/* Actions row when expanded */}
            <div className="flex justify-between items-center">
              <div className="flex gap-2">
                <button 
                  onClick={(e) => handleInteractionClick('dislike', e)}
                  className="px-2 py-1 text-zinc-600 hover:text-red-500 transition-colors text-[9px] border border-zinc-800 rounded"
                >
                  <X size={10} className="inline mr-1" /> Skip
                </button>
                <button 
                  onClick={(e) => handleInteractionClick('like', e)}
                  className={`px-2 py-1 transition-colors text-[9px] border rounded ${isLiked ? 'text-gold border-gold' : 'text-zinc-600 border-zinc-800 hover:text-gold hover:border-gold'}`}
                >
                  <Heart size={10} fill={isLiked ? "currentColor" : "none"} className="inline mr-1" /> Like
                </button>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); setIsExpanded(false); setSummary(null); }}
                className="text-[9px] text-zinc-500 hover:text-white px-2 py-1"
              >
                Schließen
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // --- HERO VARIANT (Spotlight) ---
  if (variant === 'hero') {
    // Generate stable score for this event
    const displayScore = matchScore !== undefined ? matchScore : (70 + (event.id.charCodeAt(0) % 25));
    
    return (
        <div className="w-full cursor-pointer relative group overflow-hidden bg-black rounded-lg">
            <div className="aspect-[16/9] w-full relative">
                {displayImage ? (
                    <img src={displayImage} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105" />
                ) : (
                    <div className="w-full h-full flex items-center justify-center bg-zinc-900 relative">
                        <span className="text-gold text-[10px] uppercase tracking-widest relative z-10 border border-gold/30 px-3 py-1">No Image</span>
                    </div>
                )}
                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent"></div>
                
                {/* Date + Score Badge - TOP LEFT */}
                <div className="absolute top-2 left-2 z-20 flex gap-1.5">
                  <span className="bg-black/80 text-gold px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide">
                    {formatEventDate(event.date)}
                  </span>
                  <span className="bg-gold text-black px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide">
                    {displayScore}%
                  </span>
                </div>
                
                {/* Like/Dislike - TOP RIGHT */}
                <div className="absolute right-2 top-2 flex gap-1.5 z-20">
                  <button 
                    onClick={(e) => { e.stopPropagation(); onInteraction?.(event.id, 'dislike'); }}
                    className="w-7 h-7 rounded-full bg-black/60 border border-zinc-600 flex items-center justify-center text-zinc-300 hover:text-white backdrop-blur-sm"
                  >
                    <X size={14} />
                  </button>
                  <button 
                    onClick={(e) => { e.stopPropagation(); onInteraction?.(event.id, 'like'); }}
                    className={`w-7 h-7 rounded-full bg-black/60 border flex items-center justify-center transition-colors backdrop-blur-sm ${isLiked ? 'border-gold text-gold bg-gold/20' : 'border-zinc-600 text-zinc-300 hover:border-gold hover:text-gold'}`}
                  >
                    <Heart size={14} fill={isLiked ? "currentColor" : "none"} />
                  </button>
                </div>
                
                {/* Content - Bottom compact */}
                <div className="absolute bottom-0 left-0 right-0 p-3 z-10">
                    <h2 className="text-sm font-bold text-white leading-tight mb-0.5 line-clamp-1">{event.title}</h2>
                    <p className="text-white/70 text-[10px] mb-2">{event.location || event.city}</p>
                    
                    {/* Bottom row: avatars + buttons */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                            <div className="flex -space-x-1.5">
                                {mockAvatars.slice(0, 2).map((url, i) => (
                                    <img key={i} src={url} className="w-5 h-5 rounded-full border border-black object-cover" />
                                ))}
                            </div>
                            <span className="text-[9px] text-zinc-400">+{currentAttendees}</span>
                        </div>
                        
                        <div className="flex gap-1.5">
                          <button 
                              onClick={(e) => { e.stopPropagation(); handleGetSummary(e); }}
                              disabled={loadingSummary}
                              className="h-6 px-2 flex items-center gap-1 bg-zinc-900/80 text-zinc-300 text-[8px] font-medium border border-white/10 rounded backdrop-blur-sm"
                          >
                              <Sparkles size={9} className="text-gold" /> Vibe
                          </button>
                          <button 
                              onClick={(e) => { e.stopPropagation(); onToggleAttendance?.(event.id); }}
                              className={`h-6 px-2 text-[8px] font-bold border rounded backdrop-blur-sm ${isAttending ? 'bg-gold text-black border-gold' : 'text-gold border-gold/50'}`}
                          >
                              {isAttending ? '✓' : 'RSVP'}
                          </button>
                          <button 
                              onClick={(e) => { e.stopPropagation(); onJoinTribe?.(event.title); }}
                              className="h-6 px-2 bg-white/90 text-black text-[8px] font-bold rounded"
                          >
                              Join
                          </button>
                        </div>
                    </div>
                </div>
                
                {/* AI Summary overlay if active */}
                {summary && (
                  <div className="absolute bottom-0 left-0 right-0 bg-black/90 p-3 z-20 backdrop-blur-sm">
                    <button
                      onClick={(e) => { e.stopPropagation(); setSummary(null); }}
                      className="absolute top-1 right-1 text-zinc-500 hover:text-white"
                    >
                      <X size={12} />
                    </button>
                    <p className="text-[10px] text-zinc-300 leading-relaxed pr-4">"{summary}"</p>
                  </div>
                )}
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
                {matchScore !== undefined && (
                  <div className="absolute bottom-1 right-1 bg-black/80 text-gold text-[9px] font-bold px-1.5 py-1 border border-gold/30">
                    {matchScore}%
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
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-gold font-medium uppercase tracking-widest">{formatEventDate(event.date)} • {formatTime(event.time)}</span>
                      {matchScore !== undefined && (
                        <span className="bg-gold text-black text-[10px] font-bold px-1.5 py-0.5 uppercase">
                          {matchScore}%
                        </span>
                      )}
                    </div>
                    <button onClick={(e) => { e.stopPropagation(); }} className="text-zinc-500 hover:text-white transition-colors"><Share2 size={16} strokeWidth={1.5} /></button>
                </div>
                <h3 className={`text-lg font-medium leading-tight mb-1 ${isLiked ? 'text-gold' : 'text-white'}`} style={{ textShadow: '0 1px 3px rgba(0,0,0,0.8)' }}>
                    {event.title}
                </h3>
                <p className="text-sm text-zinc-400 font-light mb-4 truncate">
                  {event.location ? <span className="text-zinc-200 font-medium">{event.location}, </span> : ''}
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
        <div className="mt-4 flex gap-2 pl-24">
            {summary ? (
                 <div className="bg-zinc-900/50 p-3 border-l border-gold animate-fadeIn w-full relative">
                     <button
                       onClick={(e) => { e.stopPropagation(); setSummary(null); }}
                       className="absolute top-2 right-2 text-zinc-600 hover:text-white transition-colors"
                     >
                       <X size={14} />
                     </button>
                     <p className="text-sm text-zinc-300 font-light leading-relaxed pr-8">"{summary}"</p>
                 </div>
            ) : (
                <>
                <button 
                    onClick={handleGetSummary}
                    disabled={loadingSummary}
                    className="h-9 px-3 flex items-center justify-center gap-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-[10px] font-medium tracking-wide transition-colors border border-white/5 whitespace-nowrap"
                >
                    {loadingSummary ? <span className="animate-pulse">Checking...</span> : <><Sparkles size={12} className="text-gold" /> Vibe</>}
                </button>
                
                <button 
                    onClick={handleToggleGoingClick}
                    className={`h-9 px-3 flex items-center justify-center gap-1.5 text-[10px] font-bold tracking-wide transition-colors border whitespace-nowrap ${isAttending ? 'bg-gold text-black border-gold' : 'bg-transparent text-gold border-gold/30 hover:bg-gold/10'}`}
                >
                    {isAttending ? <><Check size={12} /> GOING</> : 'RSVP'}
                </button>

                <button 
                    onClick={() => onJoinTribe && onJoinTribe(event.title)}
                    className="h-9 flex-1 flex items-center justify-center gap-1.5 bg-white hover:bg-zinc-200 text-black text-[10px] font-bold tracking-wide transition-colors whitespace-nowrap min-w-0"
                >
                    Join Tribe
                </button>
                </>
            )}
        </div>
    </div>
  );
};