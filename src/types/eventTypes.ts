
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
