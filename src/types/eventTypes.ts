
// Shared type definitions for events and calendar
export interface Event {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  location: string;
  organizer: string;
  category: string;
  likes?: number;
  link?: string;
  image_urls?: string[]; // Added to store URLs of uploaded images
  rsvp?: {
    yes: number;
    no: number;
    maybe: number;
  };
  // New individual RSVP fields to match database columns
  rsvp_yes?: number;
  rsvp_no?: number;
  rsvp_maybe?: number;
  // Payment fields 
  is_paid?: boolean;
  payment_link?: string | null;
  // Event listing fields
  listing_expires_at?: string;
}

export interface GitHubEvent {
  date: string; // Format: "Fri, 04.04"
  event: string;
  link: string;
}

export interface EventCalendarProps {
  defaultView?: "calendar" | "list";
}

// Define shared event display format for chats
export interface EventShareData {
  eventId: string;
  title: string;
  date: string;
  time: string;
  location?: string;
  category: string;
}

export type RsvpOption = 'yes' | 'no' | 'maybe';

// Helper to normalize RSVP counts from different sources
export const normalizeRsvpCounts = (event: Event) => {
  return {
    yes: event.rsvp?.yes ?? event.rsvp_yes ?? 0,
    no: event.rsvp?.no ?? event.rsvp_no ?? 0,
    maybe: event.rsvp?.maybe ?? event.rsvp_maybe ?? 0
  };
};
