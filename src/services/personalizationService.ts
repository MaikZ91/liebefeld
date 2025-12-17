import { TribeEvent } from '@/types/tribe';

const LIKES_KEY = 'mia_liked_events';
const DISLIKES_KEY = 'mia_disliked_events';
const PREFERENCES_KEY = 'mia_user_preferences';
const PREFERRED_CATEGORIES_KEY = 'tribe_preferred_categories';

// Map auth screen categories to event categories
const CATEGORY_MAPPING: Record<string, string[]> = {
  'ausgehen': ['Ausgehen', 'Bar', 'Club', 'Nightlife', 'Sonstiges'],
  'party': ['Party', 'Club', 'Nightlife', 'Ausgehen'],
  'konzerte': ['Konzert', 'Konzerte', 'Music', 'Musik', 'Live'],
  'sport': ['Sport', 'Hochschulsport', 'Fitness', 'Outdoor'],
  'kreativitaet': ['Kreativität', 'Kunst', 'Art', 'Workshop', 'Kultur'],
};

// Time slots for preference tracking
type TimeSlotName = 'morning' | 'midday' | 'afternoon' | 'evening' | 'night';

interface EventInteraction {
  eventId: string;
  category?: string;
  location?: string;
  title: string;
  timestamp: string;
  eventTime?: string; // The time the event takes place (e.g., "19:00")
  timeSlot?: TimeSlotName; // Derived time slot
}

interface UserPreferences {
  likedCategories: Record<string, number>;
  dislikedCategories: Record<string, number>;
  likedLocations: Record<string, number>;
  dislikedLocations: Record<string, number>;
  likedKeywords: Record<string, number>;
  dislikedKeywords: Record<string, number>;
  likedTimeSlots: Record<TimeSlotName, number>; // Time preferences
  dislikedTimeSlots: Record<TimeSlotName, number>;
}

export const personalizationService = {
  // Parse time string to hour (e.g., "19:00" -> 19)
  parseTimeToHour(timeStr?: string): number | null {
    if (!timeStr) return null;
    const match = timeStr.match(/^(\d{1,2}):?\d{0,2}/);
    if (match) return parseInt(match[1], 10);
    return null;
  },

  // Categorize hour into time slot
  getTimeSlot(hour: number): TimeSlotName {
    if (hour >= 6 && hour < 11) return 'morning';      // 06:00 - 10:59
    if (hour >= 11 && hour < 14) return 'midday';      // 11:00 - 13:59
    if (hour >= 14 && hour < 17) return 'afternoon';   // 14:00 - 16:59
    if (hour >= 17 && hour < 21) return 'evening';     // 17:00 - 20:59
    return 'night';                                      // 21:00 - 05:59
  },

  // Track a like interaction
  trackLike(event: TribeEvent): void {
    const likes = this.getLikes();
    const hour = this.parseTimeToHour(event.time);
    const timeSlot = hour !== null ? this.getTimeSlot(hour) : undefined;
    
    const interaction: EventInteraction = {
      eventId: event.id,
      category: event.category,
      location: event.location || undefined,
      title: event.title,
      timestamp: new Date().toISOString(),
      eventTime: event.time,
      timeSlot,
    };
    
    likes.push(interaction);
    localStorage.setItem(LIKES_KEY, JSON.stringify(likes));
    this.updatePreferences();
  },

  // Track a dislike interaction
  trackDislike(event: TribeEvent): void {
    const dislikes = this.getDislikes();
    const hour = this.parseTimeToHour(event.time);
    const timeSlot = hour !== null ? this.getTimeSlot(hour) : undefined;
    
    const interaction: EventInteraction = {
      eventId: event.id,
      category: event.category,
      location: event.location || undefined,
      title: event.title,
      timestamp: new Date().toISOString(),
      eventTime: event.time,
      timeSlot,
    };
    
    dislikes.push(interaction);
    localStorage.setItem(DISLIKES_KEY, JSON.stringify(dislikes));
    this.updatePreferences();
  },

  // Get all likes
  getLikes(): EventInteraction[] {
    try {
      const stored = localStorage.getItem(LIKES_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  },

  // Get all dislikes
  getDislikes(): EventInteraction[] {
    try {
      const stored = localStorage.getItem(DISLIKES_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  },

  // Update aggregated preferences
  updatePreferences(): void {
    const likes = this.getLikes();
    const dislikes = this.getDislikes();

    const preferences: UserPreferences = {
      likedCategories: {},
      dislikedCategories: {},
      likedLocations: {},
      dislikedLocations: {},
      likedKeywords: {},
      dislikedKeywords: {},
      likedTimeSlots: { morning: 0, midday: 0, afternoon: 0, evening: 0, night: 0 },
      dislikedTimeSlots: { morning: 0, midday: 0, afternoon: 0, evening: 0, night: 0 },
    };

    // Aggregate likes
    likes.forEach(interaction => {
      if (interaction.category) {
        preferences.likedCategories[interaction.category] = 
          (preferences.likedCategories[interaction.category] || 0) + 1;
      }
      if (interaction.location) {
        preferences.likedLocations[interaction.location] = 
          (preferences.likedLocations[interaction.location] || 0) + 1;
      }
      if (interaction.timeSlot) {
        preferences.likedTimeSlots[interaction.timeSlot] = 
          (preferences.likedTimeSlots[interaction.timeSlot] || 0) + 1;
      }
      // Extract keywords from title
      const keywords = this.extractKeywords(interaction.title);
      keywords.forEach(keyword => {
        preferences.likedKeywords[keyword] = 
          (preferences.likedKeywords[keyword] || 0) + 1;
      });
    });

    // Aggregate dislikes
    dislikes.forEach(interaction => {
      if (interaction.category) {
        preferences.dislikedCategories[interaction.category] = 
          (preferences.dislikedCategories[interaction.category] || 0) + 1;
      }
      if (interaction.location) {
        preferences.dislikedLocations[interaction.location] = 
          (preferences.dislikedLocations[interaction.location] || 0) + 1;
      }
      if (interaction.timeSlot) {
        preferences.dislikedTimeSlots[interaction.timeSlot] = 
          (preferences.dislikedTimeSlots[interaction.timeSlot] || 0) + 1;
      }
      const keywords = this.extractKeywords(interaction.title);
      keywords.forEach(keyword => {
        preferences.dislikedKeywords[keyword] = 
          (preferences.dislikedKeywords[keyword] || 0) + 1;
      });
    });

    localStorage.setItem(PREFERENCES_KEY, JSON.stringify(preferences));
  },

  // Get aggregated preferences
  getPreferences(): UserPreferences {
    const defaultPrefs: UserPreferences = {
      likedCategories: {},
      dislikedCategories: {},
      likedLocations: {},
      dislikedLocations: {},
      likedKeywords: {},
      dislikedKeywords: {},
      likedTimeSlots: { morning: 0, midday: 0, afternoon: 0, evening: 0, night: 0 },
      dislikedTimeSlots: { morning: 0, midday: 0, afternoon: 0, evening: 0, night: 0 },
    };
    try {
      const stored = localStorage.getItem(PREFERENCES_KEY);
      if (!stored) return defaultPrefs;
      const parsed = JSON.parse(stored);
      // Ensure time slots exist for backwards compatibility
      return {
        ...defaultPrefs,
        ...parsed,
        likedTimeSlots: { ...defaultPrefs.likedTimeSlots, ...parsed.likedTimeSlots },
        dislikedTimeSlots: { ...defaultPrefs.dislikedTimeSlots, ...parsed.dislikedTimeSlots },
      };
    } catch {
      return defaultPrefs;
    }
  },

  // Get preferred time slots (sorted by preference)
  getPreferredTimeSlots(): { slot: TimeSlotName; count: number }[] {
    const preferences = this.getPreferences();
    return (Object.entries(preferences.likedTimeSlots) as [TimeSlotName, number][])
      .map(([slot, count]) => ({ slot, count }))
      .filter(({ count }) => count > 0)
      .sort((a, b) => b.count - a.count);
  },

  // Get time slot display name in German
  getTimeSlotLabel(slot: TimeSlotName): string {
    const labels: Record<TimeSlotName, string> = {
      morning: 'Morgens (6-11 Uhr)',
      midday: 'Mittags (11-14 Uhr)',
      afternoon: 'Nachmittags (14-17 Uhr)',
      evening: 'Abends (17-21 Uhr)',
      night: 'Nachts (21-6 Uhr)',
    };
    return labels[slot];
  },

  // Get preferred categories from onboarding
  getPreferredCategories(): string[] {
    try {
      const stored = localStorage.getItem(PREFERRED_CATEGORIES_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  },

  // Check if event matches preferred categories
  matchesPreferredCategory(event: TribeEvent): boolean {
    const preferredCategories = this.getPreferredCategories();
    if (preferredCategories.length === 0) return false;
    
    const eventCategory = event.category?.toLowerCase() || '';
    
    for (const prefCat of preferredCategories) {
      const mappedCategories = CATEGORY_MAPPING[prefCat] || [];
      if (mappedCategories.some(c => eventCategory.includes(c.toLowerCase()))) {
        return true;
      }
    }
    return false;
  },

  // Calculate matching score for an event (0-100%)
  calculateMatchScore(event: TribeEvent): number {
    const preferences = this.getPreferences();
    let score = 50; // Start at neutral

    // BOOST from preferred categories (onboarding selection) - +15 points
    if (this.matchesPreferredCategory(event)) {
      score += 15;
    }

    // Category scoring (±20 points)
    if (event.category) {
      const likeCount = preferences.likedCategories[event.category] || 0;
      const dislikeCount = preferences.dislikedCategories[event.category] || 0;
      score += Math.min(likeCount * 5, 20);
      score -= Math.min(dislikeCount * 5, 20);
    }

    // Location scoring (±15 points)
    if (event.location) {
      const likeCount = preferences.likedLocations[event.location] || 0;
      const dislikeCount = preferences.dislikedLocations[event.location] || 0;
      score += Math.min(likeCount * 4, 15);
      score -= Math.min(dislikeCount * 4, 15);
    }

    // Keyword scoring (±15 points)
    const keywords = this.extractKeywords(event.title);
    let keywordBonus = 0;
    let keywordPenalty = 0;
    keywords.forEach(keyword => {
      const likeCount = preferences.likedKeywords[keyword] || 0;
      const dislikeCount = preferences.dislikedKeywords[keyword] || 0;
      keywordBonus += Math.min(Number(likeCount), 3) * 2;
      keywordPenalty += Math.min(Number(dislikeCount), 3) * 2;
    });
    score += Math.min(keywordBonus, 15);
    score -= Math.min(keywordPenalty, 15);

    // Clamp to 0-100
    return Math.max(0, Math.min(100, Math.round(score)));
  },

  // Extract keywords from title (simple word splitting)
  extractKeywords(title: string): string[] {
    const stopWords = ['der', 'die', 'das', 'ein', 'eine', 'und', 'oder', 'in', 'am', 'im', 'von', 'für', 'mit', 'zum', 'zur'];
    return title
      .toLowerCase()
      .split(/\s+/)
      .filter(word => word.length > 3 && !stopWords.includes(word));
  },

  // Get favorite locations (locations with most likes)
  getFavoriteLocations(): string[] {
    const preferences = this.getPreferences();
    const locations = Object.entries(preferences.likedLocations)
      .sort(([, a], [, b]) => (b as number) - (a as number))
      .slice(0, 5)
      .map(([location]) => location);
    return locations;
  },

  // Clear all personalization data
  clearAll(): void {
    localStorage.removeItem(LIKES_KEY);
    localStorage.removeItem(DISLIKES_KEY);
    localStorage.removeItem(PREFERENCES_KEY);
  },
};
