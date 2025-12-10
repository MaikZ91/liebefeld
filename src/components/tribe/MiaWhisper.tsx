import React, { useMemo } from 'react';
import { TribeEvent } from '@/types/tribe';
import { personalizationService } from '@/services/personalizationService';

interface MiaWhisperProps {
  event: TribeEvent;
  isLiked?: boolean;
  matchScore?: number;
}

// Generate contextual whisper based on event and user preferences
const generateWhisper = (event: TribeEvent, matchScore: number, isLiked: boolean): string | null => {
  const preferences = personalizationService.getPreferences();
  const likes = personalizationService.getLikes();
  const preferredCategories = personalizationService.getPreferredCategories();
  
  // Priority 1: High match score
  if (matchScore >= 85) {
    const messages = [
      "Das passt perfekt zu dir",
      "Genau dein Ding",
      "Könnte dein Highlight werden",
    ];
    return messages[Math.floor(event.id.charCodeAt(0) % messages.length)];
  }
  
  // Priority 2: Location match - user liked events at this location before
  if (event.location && preferences.likedLocations[event.location]) {
    const count = preferences.likedLocations[event.location] as number;
    if (count >= 2) {
      return `Du warst hier schon ${count}x`;
    }
  }
  
  // Priority 3: Category match from onboarding
  if (event.category) {
    const eventCatLower = event.category.toLowerCase();
    for (const prefCat of preferredCategories) {
      if (eventCatLower.includes(prefCat) || prefCat.includes(eventCatLower)) {
        return "Passt zu deinen Interessen";
      }
    }
  }
  
  // Priority 4: Similar to liked events (keyword match)
  if (event.title) {
    const eventKeywords = personalizationService['extractKeywords'](event.title);
    for (const keyword of eventKeywords) {
      if (preferences.likedKeywords[keyword] && (preferences.likedKeywords[keyword] as number) >= 2) {
        return "Ähnlich wie Events die du magst";
      }
    }
  }
  
  // Priority 5: New/trending (mock - high attendees or recent)
  if (event.attendees && event.attendees > 50) {
    return "Viele gehen hin";
  }
  
  // Priority 6: Time-based contextual hints
  const now = new Date();
  const eventDate = new Date(event.date);
  const isToday = eventDate.toDateString() === now.toDateString();
  const isTomorrow = eventDate.toDateString() === new Date(now.getTime() + 86400000).toDateString();
  
  if (isToday && matchScore >= 60) {
    return "Heute Abend frei?";
  }
  
  if (isTomorrow && matchScore >= 65) {
    return "Morgen wäre perfekt dafür";
  }
  
  // Priority 7: Weekend hint
  const dayOfWeek = eventDate.getDay();
  if ((dayOfWeek === 5 || dayOfWeek === 6) && matchScore >= 55) {
    return "Für dein Wochenende";
  }
  
  // No whisper for low relevance
  return null;
};

export const MiaWhisper: React.FC<MiaWhisperProps> = ({ event, isLiked = false, matchScore = 50 }) => {
  const whisper = useMemo(() => {
    // Don't show whisper for liked events (user already decided)
    if (isLiked) return null;
    return generateWhisper(event, matchScore, isLiked);
  }, [event.id, matchScore, isLiked]);
  
  if (!whisper) return null;
  
  return (
    <div className="flex items-center gap-1 text-[8px] text-zinc-500 italic mt-0.5 opacity-70">
      <span className="text-gold/60">✦</span>
      <span>{whisper}</span>
    </div>
  );
};

export default MiaWhisper;
