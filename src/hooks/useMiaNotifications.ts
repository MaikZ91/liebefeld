import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { MiaNotification, generateLocalNotifications } from '@/services/miaNotificationService';

interface UseMiaNotificationsOptions {
  username: string;
  interests?: string[];
  hobbies?: string[];
  favorite_locations?: string[];
  city?: string;
  likedEventIds?: string[];
  attendingEventIds?: string[];
}

export const useMiaNotifications = (options: UseMiaNotificationsOptions) => {
  const [notifications, setNotifications] = useState<MiaNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const lastFetchRef = useRef<number>(0);
  const MIN_FETCH_INTERVAL = 60_000; // 1 min between fetches

  // Load seen notification IDs from localStorage
  const getSeenIds = useCallback((): Set<string> => {
    try {
      const saved = localStorage.getItem('mia_seen_notifications');
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch { return new Set(); }
  }, []);

  const saveSeenIds = useCallback((ids: Set<string>) => {
    localStorage.setItem('mia_seen_notifications', JSON.stringify([...ids]));
  }, []);

  const fetchNotifications = useCallback(async () => {
    const now = Date.now();
    if (now - lastFetchRef.current < MIN_FETCH_INTERVAL) return;
    if (!options.username || options.username.startsWith('Guest_')) return;

    lastFetchRef.current = now;
    setIsLoading(true);

    try {
      const newNotifications = await generateLocalNotifications(
        {
          username: options.username,
          interests: options.interests,
          hobbies: options.hobbies,
          favorite_locations: options.favorite_locations,
          likedEventIds: options.likedEventIds,
          attendingEventIds: options.attendingEventIds,
        },
        options.city
      );

      const seenIds = getSeenIds();
      const withSeenState = newNotifications.map(n => ({
        ...n,
        seen: seenIds.has(n.id),
      }));

      setNotifications(withSeenState);
      setUnreadCount(withSeenState.filter(n => !n.seen).length);
    } catch (error) {
      console.error('Failed to fetch MIA notifications:', error);
    } finally {
      setIsLoading(false);
    }
  }, [options.username, options.interests, options.hobbies, options.favorite_locations, options.city, options.likedEventIds, options.attendingEventIds, getSeenIds]);

  // Mark all as seen
  const markAllSeen = useCallback(() => {
    const seenIds = getSeenIds();
    notifications.forEach(n => seenIds.add(n.id));
    saveSeenIds(seenIds);
    setNotifications(prev => prev.map(n => ({ ...n, seen: true })));
    setUnreadCount(0);
  }, [notifications, getSeenIds, saveSeenIds]);

  // Mark single as seen
  const markSeen = useCallback((id: string) => {
    const seenIds = getSeenIds();
    seenIds.add(id);
    saveSeenIds(seenIds);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, seen: true } : n));
    setUnreadCount(prev => Math.max(0, prev - 1));
  }, [getSeenIds, saveSeenIds]);

  // Initial fetch
  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Realtime subscription for new events
  useEffect(() => {
    const channel = supabase
      .channel('mia-notifications')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'community_events' }, () => {
        lastFetchRef.current = 0; // Reset throttle
        fetchNotifications();
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'user_profiles' }, () => {
        lastFetchRef.current = 0;
        fetchNotifications();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [fetchNotifications]);

  // Poll every 5 minutes for activity-based notifications
  useEffect(() => {
    const interval = setInterval(() => {
      lastFetchRef.current = 0;
      fetchNotifications();
    }, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  return {
    notifications,
    unreadCount,
    isLoading,
    markAllSeen,
    markSeen,
    refresh: () => { lastFetchRef.current = 0; fetchNotifications(); },
  };
};
