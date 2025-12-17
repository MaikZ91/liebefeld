import { TribeEvent } from '@/types/tribe';

/**
 * Normalize event title for grouping
 * - Remove "3D" suffix
 * - Normalize whitespace
 * - Lowercase for comparison
 */
export const normalizeEventTitle = (title: string): string => {
  return title
    .replace(/\s*3D\s*/gi, ' ')  // Remove "3D"
    .replace(/\s+/g, ' ')         // Normalize whitespace
    .trim()
    .toLowerCase();
};

/**
 * Create a grouping key for an event
 * Groups by normalized title + date ONLY (not location - same event at different locations should group)
 */
export const createEventGroupKey = (event: TribeEvent): string => {
  const normalizedTitle = normalizeEventTitle(event.title || '');
  const date = event.date || '';
  return `${normalizedTitle}|${date}`;
};

/**
 * Grouped event with multiple times/locations
 */
export interface TimeSlot {
  time: string;
  eventId: string;
  location?: string;
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
  
  groups.forEach((eventGroup) => {
    if (eventGroup.length === 1) {
      // Single event - no grouping needed
      result.push({
        ...eventGroup[0],
        allTimes: [{ 
          time: eventGroup[0].time || '23:00', 
          eventId: eventGroup[0].id,
          location: eventGroup[0].location,
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
        is3D: /3D/i.test(e.title || '')
      }));
      
      // Remove exact duplicates (same time + location + 3D status)
      const uniqueTimes = allTimes.filter((t, idx, arr) => 
        arr.findIndex(x => x.time === t.time && x.location === t.location && x.is3D === t.is3D) === idx
      );
      
      result.push({
        ...baseEvent,
        // Clean up title (remove 3D if present)
        title: baseEvent.title?.replace(/\s*3D\s*/gi, ' ').trim() || baseEvent.title,
        allTimes: uniqueTimes,
        selectedTimeIndex: 0
      });
    }
  });
  
  return result;
};

/**
 * Format time option display for dropdown - includes location if present
 */
export const formatTimeOption = (time: string, is3D?: boolean, location?: string): string => {
  // Extract just HH:MM
  const match = time.match(/^(\d{1,2}:\d{2})/);
  const shortTime = match ? match[1] : time;
  
  let label = shortTime;
  if (is3D) label += ' (3D)';
  if (location) label += ` • ${location}`;
  
  return label;
};
