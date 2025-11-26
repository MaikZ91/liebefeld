import React, { useState } from 'react';
import { TribeEvent } from '@/types/tribe';
import { generateEventSummary } from '@/services/tribe/aiHelpers';
import { getVibeBadgeColor, getCategoryDisplayName } from '@/utils/tribe/eventHelpers';
import { Sparkles, Users, ExternalLink, Heart } from 'lucide-react';
import { AspectRatio } from '@/components/ui/aspect-ratio';

interface TribeEventCardProps {
  event: TribeEvent;
  variant?: 'standard' | 'compact' | 'spotlight';
  onJoinCrew?: (eventId: string) => void;
  onLike?: (eventId: string) => void;
}

export const TribeEventCard: React.FC<TribeEventCardProps> = ({ 
  event, 
  variant = 'standard',
  onJoinCrew,
  onLike 
}) => {
  const [summary, setSummary] = useState<string | null>(null);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  
  const displayImage = event.image_url || '/placeholder.svg';
  const attendeeCount = event.attendees || Math.floor(Math.random() * 80) + 12;
  const matchScore = event.matchScore || 0;

  const handleGenerateSummary = async () => {
    if (summary || loadingSummary) return;
    setLoadingSummary(true);
    const generated = await generateEventSummary(event);
    setSummary(generated);
    setLoadingSummary(false);
  };

  const handleLikeClick = () => {
    setIsLiked(!isLiked);
    onLike?.(event.id);
  };

  if (variant === 'compact') {
    return (
      <div className="bg-black/60 backdrop-blur-md border border-white/10 p-3 hover:border-gold/50 transition-all cursor-pointer group">
        <div className="flex gap-3">
          <AspectRatio ratio={1} className="w-16 h-16 flex-shrink-0">
            <img 
              src={displayImage} 
              alt={event.title}
              className="w-full h-full object-cover rounded"
            />
          </AspectRatio>
          
          <div className="flex-1 min-w-0">
            <h3 className="text-white text-xs font-semibold line-clamp-1 group-hover:text-gold transition-colors">
              {event.title}
            </h3>
            <p className="text-zinc-500 text-[10px] mt-0.5">
              {new Date(event.date).toLocaleDateString('de-DE', { weekday: 'short', day: '2-digit', month: 'short' })} {event.time}
            </p>
            
            <div className="flex items-center gap-2 mt-1">
              {event.vibe && (
                <span className={`text-[8px] px-1.5 py-0.5 rounded border font-medium ${getVibeBadgeColor(event.vibe)}`}>
                  {event.vibe}
                </span>
              )}
              <span className="text-zinc-600 text-[10px] flex items-center gap-1">
                <Users size={10} /> {attendeeCount}
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (variant === 'spotlight') {
    return (
      <div className="bg-gradient-to-br from-black via-zinc-900 to-black border border-gold/30 overflow-hidden group hover:border-gold transition-all">
        <AspectRatio ratio={16/9}>
          <img 
            src={displayImage} 
            alt={event.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
          
          {/* Match Score Badge */}
          {matchScore > 0 && (
            <div className="absolute top-4 right-4 bg-gold text-black text-[10px] font-bold px-3 py-1.5 flex items-center gap-1.5 shadow-xl">
              <Sparkles size={12} />
              {matchScore}% MATCH
            </div>
          )}
          
          {/* Attendees */}
          <div className="absolute bottom-4 left-4 flex items-center gap-2">
            <div className="flex -space-x-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="w-7 h-7 rounded-full bg-zinc-700 border-2 border-black" />
              ))}
            </div>
            <span className="text-white text-xs font-medium">+{attendeeCount - 3} going</span>
          </div>
          
          {/* Content */}
          <div className="absolute bottom-0 left-0 right-0 p-6">
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1">
                {event.category && (
                  <span className="text-gold text-[10px] font-bold uppercase tracking-widest mb-1 block">
                    {getCategoryDisplayName(event.category)}
                  </span>
                )}
                <h2 className="text-white text-2xl font-bold mb-1">{event.title}</h2>
                <p className="text-zinc-400 text-sm">
                  {new Date(event.date).toLocaleDateString('de-DE', { weekday: 'long', day: '2-digit', month: 'long' })}
                </p>
              </div>
            </div>
            
            {event.vibe && (
              <span className={`inline-block text-xs px-3 py-1 rounded border font-medium mt-2 ${getVibeBadgeColor(event.vibe)}`}>
                {event.vibe}
              </span>
            )}
          </div>
        </AspectRatio>
      </div>
    );
  }

  // Standard variant
  return (
    <div className="bg-black/80 backdrop-blur-md border border-white/10 overflow-hidden hover:border-gold/50 transition-all group">
      <AspectRatio ratio={16/9}>
        <img 
          src={displayImage} 
          alt={event.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
        
        {/* Match Score */}
        {matchScore > 70 && (
          <div className="absolute top-3 right-3 bg-gold text-black text-[9px] font-bold px-2 py-1 flex items-center gap-1">
            <Sparkles size={10} />
            {matchScore}%
          </div>
        )}
        
        {/* Vibe Badge */}
        {event.vibe && (
          <div className={`absolute top-3 left-3 text-[9px] px-2 py-1 rounded border font-medium ${getVibeBadgeColor(event.vibe)}`}>
            {event.vibe}
          </div>
        )}
      </AspectRatio>

      <div className="p-4">
        {/* Category */}
        {event.category && (
          <span className="text-gold text-[9px] font-bold uppercase tracking-widest">
            {getCategoryDisplayName(event.category)}
          </span>
        )}
        
        {/* Title */}
        <h3 className="text-white text-base font-bold mt-1 mb-2 line-clamp-2">
          {event.title}
        </h3>

        {/* Date & Time */}
        <div className="text-zinc-500 text-xs mb-3">
          {new Date(event.date).toLocaleDateString('de-DE', { weekday: 'short', day: '2-digit', month: 'short' })} • {event.time}
        </div>

        {/* Description or Summary */}
        {summary ? (
          <p className="text-zinc-400 text-xs leading-relaxed mb-3">{summary}</p>
        ) : event.description ? (
          <p className="text-zinc-400 text-xs leading-relaxed mb-3 line-clamp-2">{event.description}</p>
        ) : null}

        {/* Actions */}
        <div className="flex items-center gap-2 pt-3 border-t border-white/5">
          <button
            onClick={handleLikeClick}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs transition-colors ${
              isLiked ? 'text-red-400' : 'text-zinc-500 hover:text-white'
            }`}
          >
            <Heart size={14} fill={isLiked ? 'currentColor' : 'none'} />
            <span>{(event.likes || 0) + (isLiked ? 1 : 0)}</span>
          </button>

          <button
            onClick={handleGenerateSummary}
            disabled={loadingSummary || !!summary}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-zinc-500 hover:text-gold transition-colors disabled:opacity-50"
          >
            <Sparkles size={14} />
            {loadingSummary ? 'Generating...' : summary ? 'Summary' : 'AI Summary'}
          </button>

          <div className="flex-1" />

          <div className="flex items-center gap-1 text-zinc-500 text-xs">
            <Users size={12} />
            <span>{attendeeCount}</span>
          </div>

          {event.link && (
            <a 
              href={event.link} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-zinc-500 hover:text-white transition-colors"
            >
              <ExternalLink size={14} />
            </a>
          )}
        </div>

        {/* Join Crew Button */}
        {onJoinCrew && (
          <button
            onClick={() => onJoinCrew(event.id)}
            className="w-full mt-3 bg-white hover:bg-gold text-black text-xs font-bold tracking-wide py-2 transition-colors"
          >
            Join Crew
          </button>
        )}
      </div>
    </div>
  );
};
