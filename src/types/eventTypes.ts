
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
}

export interface GitHubEvent {
  date: string; // Format: "Fri, 04.04"
  event: string;
  link: string;
}

export interface EventCalendarProps {
  defaultView?: "calendar" | "list";
}
