
export interface Event {
  id: string;
  title: string;
  description?: string;
  date: string;
  time: string;
  location: string;
  organizer?: string;
  category: string;
  link?: string;
  image_url?: string;
  image_urls?: string[];
  likes?: number;
  liked_by_users?: Array<{
    username: string;
    avatar_url?: string | null;
    timestamp: string;
  }>;
  rsvp_yes?: number;
  rsvp_no?: number;
  rsvp_maybe?: number;
  rsvp?: {
    yes: number;
    no: number;
    maybe: number;
  };
  source?: 'community' | 'github' | 'ai_generated';
  external_id?: string;
  is_paid?: boolean;
  created_at?: string; // Add created_at field for DB-based NEW badge
  city?: string;
}

// Legacy interface for backward compatibility
export interface GitHubEvent {
  hash?: string;
  event: string;
  date: string;
  time?: string;
  location?: string;
  description?: string;
  category?: string;
  genre?: string;
  type?: string;
  link?: string;
  image_url?: string;
  city?: string;
}

export type RsvpOption = 'yes' | 'no' | 'maybe';

export const normalizeRsvpCounts = (event: Event) => {
  return {
    yes: event.rsvp_yes ?? event.rsvp?.yes ?? 0,
    no: event.rsvp_no ?? event.rsvp?.no ?? 0,
    maybe: event.rsvp_maybe ?? event.rsvp?.maybe ?? 0
  };
};
