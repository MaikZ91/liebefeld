const LOCALSTORAGE_KEY = 'disliked_events';

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

  // Dislike an event
  async dislikeEvent(eventId: string): Promise<void> {
    const current = this.getLocalDislikedEvents();
    if (!current.includes(eventId)) {
      this.setLocalDislikedEvents([...current, eventId]);
    }
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
