import React, { useState } from 'react';
import { TribeEvent } from '@/types/tribe';
import { generateEventSummary } from '@/services/tribe/aiHelpers';
import { getVibeBadgeColor } from '@/utils/tribe/eventHelpers';
import { Sparkles, Users, Share2, X, Heart, Check, ExternalLink, Play, ChevronDown, Eye, Trophy } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { formatTimeOption } from '@/utils/tribe/eventGrouping';
import { getEventDisplayImage } from '@/utils/tribe/sportImages';
interface TimeSlot {
  time: string;
  eventId: string;
  location?: string;
  is3D?: boolean;
}

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
  isTopOfDay?: boolean; // Most popular event of the day
  // Grouped events props
  allTimes?: TimeSlot[];
  onTimeSelect?: (eventId: string) => void;
}

interface YouTubeVideo {
  videoId: string;
  title: string;
  thumbnail: string;
  channelTitle: string;
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

// Check if event is "new" (created within last 7 days)
const isNewEvent = (createdAt?: string): boolean => {
  if (!createdAt) return false;
  const created = new Date(createdAt);
  const now = new Date();
  const diffDays = (now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24);
  return diffDays <= 7;
};

// Check if event is a Tribe/Community event
const isTribeEvent = (event: TribeEvent): boolean => {
  // Check if source is 'community' OR if title contains 'TRIBE' (case-insensitive)
  const titleContainsTribe = event.title?.toUpperCase().includes('TRIBE') || false;
  return event.source === 'community' || titleContainsTribe;
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
  isPast = false,
  isTopOfDay = false,
  allTimes,
  onTimeSelect
}) => {
  const [summary, setSummary] = useState<string | null>(null);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [youtubeVideo, setYoutubeVideo] = useState<YouTubeVideo | null>(null);
  const [loadingVideo, setLoadingVideo] = useState(false);
  const [showVideo, setShowVideo] = useState(false);
  const [isTimeDropdownOpen, setIsTimeDropdownOpen] = useState(false);
  const [selectedTimeIndex, setSelectedTimeIndex] = useState(0);
  
  // Check if this is a grouped event with multiple times
  const hasMultipleTimes = allTimes && allTimes.length > 1;
  const currentTime = hasMultipleTimes ? allTimes[selectedTimeIndex] : null;
  
  const displayImage = getEventDisplayImage(event.image_url, event.title, event.location);
  const isNew = isNewEvent(event.created_at);
  const isTribe = isTribeEvent(event);

  // Calculate engagement/views score
  const likesCount = event.likes || 0;
  const attendeesCount = event.attendees || 0;
  const likedByCount = Array.isArray(event.liked_by_users) ? event.liked_by_users.length : 0;
  const engagementScore = event.views || (likesCount * 3) + attendeesCount + (likedByCount * 2);

  // Mock Attendees Data
  const baseCount = event.attendees || Math.floor(Math.random() * 80) + 12;
  const currentAttendees = isAttending ? baseCount + 1 : baseCount;
  const mockAvatars = [
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=64&h=64&fit=crop",
      "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=64&h=64&fit=crop",
      "https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=64&h=64&fit=crop"
  ];

  // Build YouTube search query from event info
  const buildYouTubeQuery = () => {
    const parts: string[] = [];
    // Extract artist/band name from title (often before "-" or ":" or at start)
    const title = event.title || '';
    const cleanTitle = title.replace(/[–—]/g, '-');
    
    // Try to extract artist name
    if (cleanTitle.includes(':')) {
      parts.push(cleanTitle.split(':')[1]?.trim() || cleanTitle);
    } else if (cleanTitle.includes('-')) {
      parts.push(cleanTitle.split('-')[0]?.trim() || cleanTitle);
    } else {
      parts.push(cleanTitle);
    }
    
    // Add category hint for better results
    const category = event.category?.toLowerCase() || '';
    if (category.includes('party') || category.includes('ausgehen')) {
      parts.push('live set DJ');
    } else if (category.includes('konzert') || category.includes('concert')) {
      parts.push('live performance');
    } else if (category.includes('sport')) {
      parts.push('highlights');
    }
    
    return parts.join(' ').slice(0, 80); // YouTube query limit
  };

  const fetchYouTubeVideo = async () => {
    if (youtubeVideo || loadingVideo) return;
    
    setLoadingVideo(true);
    try {
      const query = buildYouTubeQuery();
      console.log('[TribeEventCard] YouTube search:', query);
      
      const { data, error } = await supabase.functions.invoke('youtube-search', {
        body: { query, maxResults: 1 }
      });
      
      if (error) {
        console.error('[TribeEventCard] YouTube search error:', error);
      } else if (data?.videos?.length > 0) {
        setYoutubeVideo(data.videos[0]);
      }
    } catch (err) {
      console.error('[TribeEventCard] YouTube fetch error:', err);
    } finally {
      setLoadingVideo(false);
    }
  };

  const handleGetSummary = async (e: React.MouseEvent) => {
      e.stopPropagation();
      if (summary) {
        // Toggle expanded view when clicking on already loaded summary
        setIsExpanded(!isExpanded);
        return;
      }
      setLoadingSummary(true);
      setIsExpanded(true); // Expand image when loading
      
      // Fetch both summary and YouTube video in parallel
      const [aiSummary] = await Promise.all([
        generateEventSummary(event),
        fetchYouTubeVideo()
      ]);
      
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
      <div className={`transition-all duration-500 ${animationClass} ${isPast ? 'opacity-40 grayscale' : ''} ${isTopOfDay ? 'bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-transparent border border-amber-500/40 rounded-lg' : isTribe ? 'bg-gradient-to-r from-gold/10 via-gold/5 to-transparent border border-gold/30 rounded-lg shadow-[0_0_15px_rgba(212,175,55,0.15)]' : 'bg-black border-b border-white/5'}`}>
        <div className={`flex items-start gap-2.5 py-2 transition-all duration-300 ${isExpanded ? 'flex-col' : ''} ${isTribe || isTopOfDay ? 'px-2' : ''}`}>
          {/* Thumbnail - Expands when Vibe is clicked */}
          <div className={`bg-zinc-900 flex-shrink-0 relative overflow-hidden rounded transition-all duration-300 ${
            isExpanded ? 'w-full aspect-video' : 'w-12 h-14'
          } ${isTribe ? 'ring-1 ring-gold/30' : ''} ${isTopOfDay ? 'ring-1 ring-amber-500/50' : ''}`}>
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
            {isTopOfDay && !isPast && !isExpanded && (
              <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-amber-500 to-orange-500 text-black text-[6px] font-bold px-1 py-0.5 text-center uppercase tracking-wider flex items-center justify-center gap-0.5">
                <Trophy size={7} /> TOP
              </div>
            )}
            {isTribe && !isPast && !isExpanded && !isTopOfDay && (
              <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-gold to-amber-500 text-black text-[6px] font-bold px-1 py-0.5 text-center uppercase tracking-wider">
                TRIBE
              </div>
            )}
            {isLiked && !isPast && !isTribe && !isExpanded && !isTopOfDay && (
              <div className="absolute top-0 left-0 right-0 bg-gold/90 text-black text-[6px] font-bold px-1 py-0.5 text-center">
                ★
              </div>
            )}
            {isNew && !isPast && !isLiked && !isTribe && !isExpanded && !isTopOfDay && (
              <div className="absolute top-0 left-0 right-0 bg-emerald-500/90 text-white text-[6px] font-bold px-1 py-0.5 text-center uppercase tracking-wider">
                New
              </div>
            )}
          </div>

          {/* Info - Full width when expanded */}
          <div className={`min-w-0 ${isExpanded ? 'w-full px-1' : 'flex-1'}`}>
            <div className="flex items-center gap-1.5">
              <h3 className={`font-medium leading-tight ${isLiked ? 'text-gold' : isTribe ? 'text-gold font-semibold' : 'text-white'} ${isExpanded ? 'text-sm mb-1' : 'text-xs truncate'}`}>
                {event.title}
              </h3>
              {isTribe && isExpanded && (
                <span className="text-[7px] bg-gold/20 text-gold border border-gold/30 px-1.5 py-0.5 rounded uppercase tracking-wider font-bold">
                  Community
                </span>
              )}
            </div>
            <div className="flex items-center gap-1.5 text-[10px] text-zinc-500 mt-0.5">
              {/* Time display - dropdown if multiple times/locations */}
              {hasMultipleTimes ? (
                <div className="relative flex-1 min-w-0">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsTimeDropdownOpen(!isTimeDropdownOpen);
                    }}
                    className="font-mono flex items-center gap-0.5 text-gold hover:text-gold/80 transition-colors max-w-full"
                  >
                    <span className="truncate">
                      {formatTimeOption(currentTime || { time: event.time || '23:00', eventId: event.id })}
                    </span>
                    <ChevronDown size={10} className={`flex-shrink-0 transition-transform ${isTimeDropdownOpen ? 'rotate-180' : ''}`} />
                    <span className="text-[8px] text-zinc-600 ml-0.5 flex-shrink-0">+{allTimes.length - 1}</span>
                  </button>
                  {isTimeDropdownOpen && (
                    <div className="absolute top-full left-0 mt-1 bg-zinc-900 border border-zinc-700 rounded shadow-xl z-50 min-w-[180px] max-w-[280px]">
                      {allTimes.map((slot, idx) => (
                        <button
                          key={slot.eventId}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedTimeIndex(idx);
                            setIsTimeDropdownOpen(false);
                            if (onTimeSelect) onTimeSelect(slot.eventId);
                          }}
                          className={`block w-full text-left px-2 py-1.5 text-[10px] hover:bg-zinc-800 transition-colors ${
                            idx === selectedTimeIndex ? 'text-gold bg-zinc-800' : 'text-zinc-300'
                          }`}
                        >
                          {formatTimeOption(slot)}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <>
                  <span className="font-mono">{formatTime(event.time)}</span>
                  {event.location && (
                    <>
                      <span className="text-zinc-700">•</span>
                      <span className={`text-zinc-400 ${isExpanded ? '' : 'truncate'}`}>{event.location}</span>
                    </>
                  )}
                </>
              )}
            </div>
                            {/* Attendees/Likes avatars under location */}
                            <div className="flex items-center gap-2 mt-1">
                              <div className="flex items-center gap-1">
                                <div className="flex -space-x-1.5">
                                  {isAttending && (
                                    <div className="w-4 h-4 rounded-full border border-black bg-gold flex items-center justify-center">
                                      <Check size={8} className="text-black" />
                                    </div>
                                  )}
                                  {/* Show liked_by_users avatars if available */}
                                  {event.liked_by_users && Array.isArray(event.liked_by_users) && event.liked_by_users.slice(0, 3).map((u: any, i: number) => (
                                    <div key={i} className="w-4 h-4 rounded-full border border-black bg-zinc-800 overflow-hidden" title={u.username || 'User'}>
                                      {u.avatar ? (
                                        <img src={u.avatar} className="w-full h-full object-cover" />
                                      ) : (
                                        <span className="text-[6px] text-zinc-500 flex items-center justify-center h-full">{(u.username || '?')[0]}</span>
                                      )}
                                    </div>
                                  ))}
                                  {/* Fallback to mock avatars if no liked_by_users */}
                                  {(!event.liked_by_users || !Array.isArray(event.liked_by_users) || event.liked_by_users.length === 0) && 
                                    mockAvatars.slice(0, 2).map((url, i) => (
                                      <img key={i} src={url} className="w-4 h-4 rounded-full border border-black object-cover" />
                                    ))
                                  }
                                </div>
                                <span className={`text-[9px] ${isAttending ? "text-gold font-bold" : "text-zinc-500"}`}>
                                  {event.likes && event.likes > 0 ? `+${event.likes}` : `+${currentAttendees}`}
                                </span>
                              </div>
                              {/* Views/Engagement indicator */}
                              {engagementScore > 0 && (
                                <div className="flex items-center gap-0.5 text-zinc-600">
                                  <Eye size={9} />
                                  <span className="text-[8px]">{engagementScore}</span>
                                </div>
                              )}
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
            {/* YouTube Video Preview */}
            {(loadingVideo || youtubeVideo) && (
              <div className="mb-2">
                {loadingVideo ? (
                  <div className="aspect-video bg-zinc-900 rounded flex items-center justify-center">
                    <div className="w-4 h-4 border-2 border-zinc-600 border-t-gold rounded-full animate-spin" />
                  </div>
                ) : youtubeVideo && !showVideo ? (
                  <div 
                    className="relative aspect-video bg-zinc-900 rounded overflow-hidden cursor-pointer group"
                    onClick={(e) => { e.stopPropagation(); setShowVideo(true); }}
                  >
                    <img 
                      src={youtubeVideo.thumbnail} 
                      alt={youtubeVideo.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center group-hover:bg-black/20 transition-colors">
                      <div className="w-10 h-10 rounded-full bg-red-600 flex items-center justify-center shadow-lg">
                        <Play size={18} className="text-white ml-0.5" fill="white" />
                      </div>
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-1.5">
                      <p className="text-[8px] text-white/80 truncate">{youtubeVideo.channelTitle}</p>
                    </div>
                  </div>
                ) : youtubeVideo && showVideo ? (
                  <div className="aspect-video rounded overflow-hidden">
                    <iframe
                      src={`https://www.youtube.com/embed/${youtubeVideo.videoId}?autoplay=1`}
                      title={youtubeVideo.title}
                      className="w-full h-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                ) : null}
              </div>
            )}
            
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
        <div className={`w-full cursor-pointer relative group overflow-hidden rounded-lg ${isTribe ? 'ring-2 ring-gold/50 shadow-[0_0_20px_rgba(212,175,55,0.2)]' : 'bg-black'}`}>
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
                
                {/* Date + Score + Tribe Badge - TOP LEFT */}
                <div className="absolute top-2 left-2 z-20 flex gap-1.5">
                  {isTribe && (
                    <span className="bg-gradient-to-r from-gold to-amber-500 text-black px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide">
                      TRIBE
                    </span>
                  )}
                  <span className="bg-black/80 text-gold px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide">
                    {formatEventDate(event.date)}
                  </span>
                  <span className="bg-gold text-black px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide">
                    {displayScore}%
                  </span>
                  {isNew && !isTribe && (
                    <span className="bg-emerald-500 text-white px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide">
                      New
                    </span>
                  )}
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
                    <h2 className={`text-sm font-bold leading-tight mb-0.5 line-clamp-1 ${isTribe ? 'text-gold' : 'text-white'}`}>{event.title}</h2>
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
    <div className={`pb-6 mb-2 transition-all duration-500 ${animationClass} ${isTribe ? 'bg-gradient-to-r from-gold/10 via-gold/5 to-transparent border border-gold/30 rounded-lg p-3 shadow-[0_0_20px_rgba(212,175,55,0.15)]' : 'bg-black border-b border-white/5'}`}>
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
                {isTribe && (
                  <div className="absolute top-1 left-1 bg-gradient-to-r from-gold to-amber-500 text-black text-[8px] font-bold px-1.5 py-0.5 uppercase tracking-wide">
                    TRIBE
                  </div>
                )}
                {isLiked && !isTribe && (
                  <div className="absolute top-1 left-1 bg-gold text-black text-[8px] font-bold px-1.5 py-0.5 uppercase tracking-wide">
                    Liked
                  </div>
                )}
                {isNew && !isLiked && !isTribe && (
                  <div className="absolute top-1 left-1 bg-emerald-500 text-white text-[8px] font-bold px-1.5 py-0.5 uppercase tracking-wide">
                    New
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
                <h3 className={`text-lg font-medium leading-tight mb-1 ${isLiked ? 'text-gold' : isTribe ? 'text-gold font-semibold' : 'text-white'}`} style={{ textShadow: '0 1px 3px rgba(0,0,0,0.8)' }}>
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