import { supabase } from '@/integrations/supabase/client';

const BEHAVIOR_KEY = 'user_event_behavior';

interface UserBehavior {
  likedEvents: string[];
  viewedEvents: string[];
  rsvpEvents: string[];
  categoryPreferences: Record<string, number>;
  locationPreferences: Record<string, number>;
}

export const behaviorTracking = {
  getBehavior(): UserBehavior {
    const stored = localStorage.getItem(BEHAVIOR_KEY);
    return stored ? JSON.parse(stored) : {
      likedEvents: [],
      viewedEvents: [],
      rsvpEvents: [],
      categoryPreferences: {},
      locationPreferences: {}
    };
  },

  saveBehavior(behavior: UserBehavior) {
    localStorage.setItem(BEHAVIOR_KEY, JSON.stringify(behavior));
  },

  trackLike(eventId: string, category?: string, location?: string) {
    const behavior = this.getBehavior();
    if (!behavior.likedEvents.includes(eventId)) {
      behavior.likedEvents.push(eventId);
    }
    
    if (category) {
      behavior.categoryPreferences[category] = (behavior.categoryPreferences[category] || 0) + 2;
    }
    if (location) {
      behavior.locationPreferences[location] = (behavior.locationPreferences[location] || 0) + 1;
    }
    
    this.saveBehavior(behavior);
  },

  trackView(eventId: string, category?: string, location?: string) {
    const behavior = this.getBehavior();
    if (!behavior.viewedEvents.includes(eventId)) {
      behavior.viewedEvents.push(eventId);
    }
    
    if (category) {
      behavior.categoryPreferences[category] = (behavior.categoryPreferences[category] || 0) + 0.5;
    }
    if (location) {
      behavior.locationPreferences[location] = (behavior.locationPreferences[location] || 0) + 0.5;
    }
    
    this.saveBehavior(behavior);
  },

  trackRSVP(eventId: string, category?: string, location?: string) {
    const behavior = this.getBehavior();
    if (!behavior.rsvpEvents.includes(eventId)) {
      behavior.rsvpEvents.push(eventId);
    }
    
    if (category) {
      behavior.categoryPreferences[category] = (behavior.categoryPreferences[category] || 0) + 3;
    }
    if (location) {
      behavior.locationPreferences[location] = (behavior.locationPreferences[location] || 0) + 2;
    }
    
    this.saveBehavior(behavior);
  },

  getTopCategories(limit = 3): string[] {
    const behavior = this.getBehavior();
    return Object.entries(behavior.categoryPreferences)
      .sort(([, a], [, b]) => (b as number) - (a as number))
      .slice(0, limit)
      .map(([category]) => category);
  },

  getTopLocations(limit = 3): string[] {
    const behavior = this.getBehavior();
    return Object.entries(behavior.locationPreferences)
      .sort(([, a], [, b]) => (b as number) - (a as number))
      .slice(0, limit)
      .map(([location]) => location);
  },

  getRecommendationScore(category?: string, location?: string): number {
    const behavior = this.getBehavior();
    let score = 0;
    
    if (category) {
      score += behavior.categoryPreferences[category] || 0;
    }
    if (location) {
      score += behavior.locationPreferences[location] || 0;
    }
    
    return score;
  }
};
