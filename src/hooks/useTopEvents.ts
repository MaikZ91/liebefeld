
import { useState, useEffect } from 'react';
import { Event } from '../types/eventTypes';

export const useTopEvents = (events: Event[]) => {
    const [topEventsPerDay, setTopEventsPerDay] = useState<Record<string, string>>({});

    useEffect(() => {
        const topEventsByDay: Record<string, string> = {};
        const eventsByDate: Record<string, Event[]> = {};

        events.forEach(event => {
            if (!event.date) return;
            if (!eventsByDate[event.date]) {
                eventsByDate[event.date] = [];
            }
            eventsByDate[event.date].push(event);
        });

        Object.keys(eventsByDate).forEach(date => {
            const sortedEvents = [...eventsByDate[date]].sort((a, b) => {
                const bLikes = b.likes || 0;
                const aLikes = a.likes || 0;
                if (bLikes !== aLikes) {
                    return bLikes - aLikes;
                }
                return a.id.localeCompare(b.id);
            });

            if (sortedEvents.length > 0) {
                topEventsByDay[date] = sortedEvents[0].id;
            }
        });

        setTopEventsPerDay(topEventsByDay);
    }, [events]);

    return topEventsPerDay;
};
