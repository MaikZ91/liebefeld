import { TribeEvent } from '@/types/tribe';

/**
 * Convert community_events to TribeEvent format
 */
export const convertToTribeEvent = (event: any): TribeEvent => {
  return {
    id: event.id,
    date: event.date,
    time: event.time,
    title: event.title,
    event: event.title,
    category: event.category,
    description: event.description,
    link: event.link || '',
    image_url: event.image_url,
    city: event.city,
    location: event.location,
    likes: event.likes || 0,
    liked_by_users: event.liked_by_users,
    // Calculate match score based on likes and recency
    matchScore: calculateMatchScore(event),
    attendees: event.likes || Math.floor(Math.random() * 50) + 10,
    vibe: inferVibe(event),
    attendeeAvatars: [],
  };
};

/**
 * Calculate match score (0-100) based on event popularity
 */
const calculateMatchScore = (event: any): number => {
  const likes = event.likes || 0;
  const baseScore = Math.min(likes * 5, 70); // Max 70 from likes
  
  // Bonus for recent events
  const eventDate = new Date(event.date);
  const today = new Date();
  const daysUntil = Math.ceil((eventDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  const recencyBonus = daysUntil >= 0 && daysUntil <= 7 ? 30 : 0;
  
  return Math.min(baseScore + recencyBonus, 100);
};

/**
 * Infer vibe from event category
 */
const inferVibe = (event: any): 'RAGE' | 'CHILL' | 'ARTSY' | 'FLIRTY' => {
  const category = (event.category || '').toLowerCase();
  
  if (category.includes('party') || category.includes('konzert')) return 'RAGE';
  if (category.includes('kunst') || category.includes('kreativ')) return 'ARTSY';
  if (category.includes('bar') || category.includes('kneipe')) return 'FLIRTY';
  return 'CHILL';
};

/**
 * Get category display name
 */
export const getCategoryDisplayName = (category: string): string => {
  const mapping: Record<string, string> = {
    'ausgehen': 'PARTY',
    'kreativität': 'ART',
    'sport': 'SPORT',
    'konzert': 'CONCERT',
  };
  
  return mapping[category.toLowerCase()] || category.toUpperCase();
};

/**
 * Get vibe badge color
 */
export const getVibeBadgeColor = (vibe?: string): string => {
  switch (vibe) {
    case 'RAGE': return 'bg-red-500/20 text-red-300 border-red-500/30';
    case 'CHILL': return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
    case 'ARTSY': return 'bg-purple-500/20 text-purple-300 border-purple-500/30';
    case 'FLIRTY': return 'bg-pink-500/20 text-pink-300 border-pink-500/30';
    default: return 'bg-zinc-800 text-zinc-400 border-zinc-700';
  }
};
