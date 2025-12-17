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
 * Groups by normalized title + location + date
 */
export const createEventGroupKey = (event: TribeEvent): string => {
  const normalizedTitle = normalizeEventTitle(event.title || '');
  const location = (event.location || '').toLowerCase().trim();
  const date = event.date || '';
  return `${normalizedTitle}|${location}|${date}`;
};

/**
 * Grouped event with multiple times
 */
export interface GroupedEvent extends TribeEvent {
  allTimes: { time: string; eventId: string; is3D?: boolean }[];
  selectedTimeIndex: number;
}

/**
 * Group similar events by title/location/date
 * Returns grouped events with all available times
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
          is3D: /3D/i.test(eventGroup[0].title || '')
        }],
        selectedTimeIndex: 0
      });
    } else {
      // Multiple events - group times
      // Sort by time
      eventGroup.sort((a, b) => {
        const timeA = a.time || '23:59';
        const timeB = b.time || '23:59';
        return timeA.localeCompare(timeB);
      });
      
      // Use first event as base, collect all times
      const baseEvent = eventGroup[0];
      const allTimes = eventGroup.map(e => ({
        time: e.time || '23:00',
        eventId: e.id,
        is3D: /3D/i.test(e.title || '')
      }));
      
      // Remove duplicates by time
      const uniqueTimes = allTimes.filter((t, idx, arr) => 
        arr.findIndex(x => x.time === t.time && x.is3D === t.is3D) === idx
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
 * Format time display for dropdown
 */
export const formatTimeOption = (time: string, is3D?: boolean): string => {
  // Extract just HH:MM
  const match = time.match(/^(\d{1,2}:\d{2})/);
  const shortTime = match ? match[1] : time;
  return is3D ? `${shortTime} (3D)` : shortTime;
};
