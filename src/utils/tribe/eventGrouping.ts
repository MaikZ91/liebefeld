import { TribeEvent } from '@/types/tribe';

/**
 * Activity keywords that should be grouped together
 */
const ACTIVITY_KEYWORDS: Record<string, string> = {
  // Running variants
  'laufen': 'laufen',
  'lauftreff': 'laufen',
  'läufer': 'laufen',
  'running': 'laufen',
  'joggen': 'laufen',
  'jogging': 'laufen',
  // Volleyball
  'volleyball': 'volleyball',
  'beachvolleyball': 'volleyball',
  // Badminton
  'badminton': 'badminton',
  // Basketball
  'basketball': 'basketball',
  // Yoga
  'yoga': 'yoga',
  // Fitness
  'fitness': 'fitness',
  'krafttraining': 'fitness',
  // Swimming
  'schwimmen': 'schwimmen',
  'swimming': 'schwimmen',
};

/**
 * Extract the primary activity keyword from a title
 */
const extractActivityKeyword = (title: string): string | null => {
  const lower = title.toLowerCase();
  for (const [keyword, activity] of Object.entries(ACTIVITY_KEYWORDS)) {
    if (lower.includes(keyword)) {
      return activity;
    }
  }
  return null;
};

/**
 * Normalize event title for grouping
 * - Remove "3D" suffix
 * - Remove "The " prefix (case-insensitive)
 * - Remove "& More" / "&More" suffix (case-insensitive)
 * - Normalize whitespace
 * - Lowercase for comparison
 */
export const normalizeEventTitle = (title: string): string => {
  return title
    .replace(/^the\s+/gi, '')        // Remove "The " prefix
    .replace(/\s*&\s*more$/gi, '')   // Remove "& More" suffix
    .replace(/\s*3D\s*/gi, ' ')      // Remove "3D"
    .replace(/\s+/g, ' ')            // Normalize whitespace
    .trim()
    .toLowerCase();
};

/**
 * Create a grouping key for an event
 * Groups by activity keyword (if found) OR normalized title + date
 */
export const createEventGroupKey = (event: TribeEvent): string => {
  const title = event.title || '';
  const date = event.date || '';
  
  // Check if this is an activity that should be grouped
  const activity = extractActivityKeyword(title);
  if (activity) {
    return `activity:${activity}|${date}`;
  }
  
  // Fall back to normalized title
  const normalizedTitle = normalizeEventTitle(title);
  return `${normalizedTitle}|${date}`;
};

/**
 * Grouped event with multiple times/locations
 */
export interface TimeSlot {
  time: string;
  eventId: string;
  location?: string;
  organizer?: string;
  title?: string;
  is3D?: boolean;
}

export interface GroupedEvent extends TribeEvent {
  allTimes: TimeSlot[];
  selectedTimeIndex: number;
}

/**
 * Group similar events by title/date (ignoring location)
 * Returns grouped events with all available times and locations
 */
export const groupSimilarEvents = (events: TribeEvent[]): GroupedEvent[] => {
  const groups = new Map<string, TribeEvent[]>();
  
  // Group events by key
  events.forEach(event => {
    const key = createEventGroupKey(event);
    if (!groups.has(key)) {
      groups.set(key, []);
    }
    groups.get(key)!.push(event);
  });
  
  // Convert groups to GroupedEvent array
  const result: GroupedEvent[] = [];
  
  groups.forEach((eventGroup, key) => {
    const isActivityGroup = key.startsWith('activity:');
    
    if (eventGroup.length === 1) {
      // Single event - no grouping needed
      result.push({
        ...eventGroup[0],
        allTimes: [{ 
          time: eventGroup[0].time || '23:00', 
          eventId: eventGroup[0].id,
          location: eventGroup[0].location,
          organizer: eventGroup[0].organizer,
          title: eventGroup[0].title,
          is3D: /3D/i.test(eventGroup[0].title || '')
        }],
        selectedTimeIndex: 0
      });
    } else {
      // Multiple events - group times/locations
      // Sort by time first, then location
      eventGroup.sort((a, b) => {
        const timeA = a.time || '23:59';
        const timeB = b.time || '23:59';
        const timeCompare = timeA.localeCompare(timeB);
        if (timeCompare !== 0) return timeCompare;
        return (a.location || '').localeCompare(b.location || '');
      });
      
      // Use first event as base, collect all times/locations
      const baseEvent = eventGroup[0];
      const allTimes: TimeSlot[] = eventGroup.map(e => ({
        time: e.time || '23:00',
        eventId: e.id,
        location: e.location,
        organizer: e.organizer,
        title: e.title,
        is3D: /3D/i.test(e.title || '')
      }));
      
      // Remove exact duplicates (same time + location + 3D status)
      const uniqueTimes = allTimes.filter((t, idx, arr) => 
        arr.findIndex(x => x.time === t.time && x.location === t.location && x.is3D === t.is3D) === idx
      );
      
      // For activity groups, use the activity name as title
      let displayTitle = baseEvent.title;
      if (isActivityGroup) {
        const activity = key.split(':')[1].split('|')[0];
        // Capitalize first letter
        displayTitle = activity.charAt(0).toUpperCase() + activity.slice(1);
      } else {
        displayTitle = baseEvent.title?.replace(/\s*3D\s*/gi, ' ').trim() || baseEvent.title;
      }
      
      result.push({
        ...baseEvent,
        title: displayTitle,
        allTimes: uniqueTimes,
        selectedTimeIndex: 0
      });
    }
  });
  
  return result;
};

/**
 * Format time option display for dropdown - includes organizer/title for activity groups
 */
export const formatTimeOption = (slot: TimeSlot): string => {
  const { time, is3D, location, organizer, title } = slot;
  
  // Extract just HH:MM
  const match = time.match(/^(\d{1,2}:\d{2})/);
  const shortTime = match ? match[1] : time;
  
  let label = shortTime;
  if (is3D) label += ' (3D)';
  
  // Show organizer or title to distinguish between grouped events
  if (organizer) {
    label += ` • ${organizer}`;
  } else if (title && location) {
    // Show short title if different variants
    label += ` • ${title}`;
  } else if (location) {
    label += ` • ${location}`;
  }
  
  return label;
};
