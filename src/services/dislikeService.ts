const LOCALSTORAGE_KEY = 'disliked_events';
const LOCALSTORAGE_LOCATIONS_KEY = 'disliked_event_locations';
const LOCALSTORAGE_BLOCKED_LOCATIONS_KEY = 'blocked_locations';

export const dislikeService = {
  // Get disliked events from localStorage
  getLocalDislikedEvents(): string[] {
    try {
      const stored = localStorage.getItem(LOCALSTORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  },

  // Save disliked events to localStorage
  setLocalDislikedEvents(eventIds: string[]): void {
    try {
      localStorage.setItem(LOCALSTORAGE_KEY, JSON.stringify(eventIds));
    } catch (error) {
      console.error('Error saving to localStorage:', error);
    }
  },

  // Track location dislikes
  getLocationDislikes(): Record<string, number> {
    try {
      const stored = localStorage.getItem(LOCALSTORAGE_LOCATIONS_KEY);
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  },

  setLocationDislikes(locations: Record<string, number>): void {
    try {
      localStorage.setItem(LOCALSTORAGE_LOCATIONS_KEY, JSON.stringify(locations));
    } catch (error) {
      console.error('Error saving location dislikes:', error);
    }
  },

  incrementLocationDislike(location: string): number {
    const current = this.getLocationDislikes();
    const count = (current[location] || 0) + 1;
    current[location] = count;
    this.setLocationDislikes(current);
    return count;
  },

  // Blocked locations
  getBlockedLocations(): string[] {
    try {
      const stored = localStorage.getItem(LOCALSTORAGE_BLOCKED_LOCATIONS_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  },

  setBlockedLocations(locations: string[]): void {
    try {
      localStorage.setItem(LOCALSTORAGE_BLOCKED_LOCATIONS_KEY, JSON.stringify(locations));
    } catch (error) {
      console.error('Error saving blocked locations:', error);
    }
  },

  blockLocation(location: string): void {
    const current = this.getBlockedLocations();
    if (!current.includes(location)) {
      this.setBlockedLocations([...current, location]);
    }
  },

  isLocationBlocked(location: string): boolean {
    return this.getBlockedLocations().includes(location);
  },

  // Dislike an event
  async dislikeEvent(eventId: string, location?: string): Promise<{ shouldAskBlock: boolean; location: string | null }> {
    const current = this.getLocalDislikedEvents();
    if (!current.includes(eventId)) {
      this.setLocalDislikedEvents([...current, eventId]);
    }

    // Track location if provided
    if (location) {
      const count = this.incrementLocationDislike(location);
      if (count === 3 && !this.isLocationBlocked(location)) {
        return { shouldAskBlock: true, location };
      }
    }

    return { shouldAskBlock: false, location: null };
  },

  // Undislike an event
  async undislikeEvent(eventId: string): Promise<void> {
    const current = this.getLocalDislikedEvents();
    this.setLocalDislikedEvents(current.filter(id => id !== eventId));
  },

  // Get all disliked events
  async getDislikedEvents(): Promise<string[]> {
    return this.getLocalDislikedEvents();
  }
};
