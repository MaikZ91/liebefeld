import { supabase } from '@/integrations/supabase/client';

export interface MiaNotification {
  id: string;
  type: 'new_event' | 'user_activity' | 'new_member' | 'upcoming_tribe' | 'daily_recommendation' | 'event_like' | 'event_reminder';
  text: string;
  avatarUrl?: string; // User profile picture for people-related notifications
  actionLabel?: string;
  actionType?: 'view_event' | 'view_profile' | 'rsvp' | 'create_event' | 'chat_mia';
  actionPayload?: string;
  seen: boolean;
  createdAt: string;
}

interface NotificationContext {
  username: string;
  interests?: string[];
  hobbies?: string[];
  favorite_locations?: string[];
  likedEventIds?: string[];
  attendingEventIds?: string[];
}

/**
 * Fetch recent new events (last 6 hours)
 */
export const fetchRecentNewEvents = async (city?: string) => {
  const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString();
  const today = new Date().toISOString().split('T')[0];

  let query = supabase
    .from('community_events')
    .select('id, title, category, date, time, location, city, likes')
    .gte('created_at', sixHoursAgo)
    .gte('date', today)
    .order('created_at', { ascending: false })
    .limit(5);

  if (city && city !== 'Deutschland') {
    query = query.ilike('city', city);
  }

  const { data } = await query;
  return data || [];
};

/**
 * Fetch recent user activity (who's looking at what)
 */
export const fetchRecentUserActivity = async (excludeUsername: string) => {
  const thirtyMinAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();

  const { data } = await supabase
    .from('user_activity_logs')
    .select('username, event_type, event_data, page_path, created_at')
    .gte('created_at', thirtyMinAgo)
    .neq('username', excludeUsername)
    .not('username', 'like', 'Guest_%')
    .eq('event_type', 'click')
    .order('created_at', { ascending: false })
    .limit(10);

  return data || [];
};

/**
 * Fetch new community members (last 24 hours)
 */
export const fetchNewMembers = async (excludeUsername: string) => {
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  const { data } = await supabase
    .from('user_profiles')
    .select('username, avatar, interests, hobbies, created_at')
    .gte('created_at', oneDayAgo)
    .neq('username', excludeUsername)
    .not('username', 'like', 'Guest_%')
    .order('created_at', { ascending: false })
    .limit(5);

  return data || [];
};

/**
 * Fetch today's popular events (most liked)
 */
export const fetchTodaysTopEvents = async (city?: string) => {
  const today = new Date().toISOString().split('T')[0];
  const threeDaysLater = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  let query = supabase
    .from('community_events')
    .select('id, title, category, date, time, location, city, likes')
    .gte('date', today)
    .lte('date', threeDaysLater)
    .order('likes', { ascending: false })
    .limit(5);

  if (city && city !== 'Deutschland') {
    query = query.ilike('city', city);
  }

  const { data } = await query;
  return data || [];
};

/**
 * Generate notifications from raw data (local, no AI needed for basic ones)
 */
export const generateLocalNotifications = async (
  context: NotificationContext,
  city?: string
): Promise<MiaNotification[]> => {
  const notifications: MiaNotification[] = [];
  const now = new Date().toISOString();

  try {
    // 1. New events
    const newEvents = await fetchRecentNewEvents(city);
    for (const event of newEvents.slice(0, 2)) {
      notifications.push({
        id: `new_event_${event.id}`,
        type: 'new_event',
        text: `Hey! Neues Event: "${event.title}" am ${event.date}${event.location ? ` in ${event.location}` : ''} 🎉`,
        actionLabel: 'Event ansehen',
        actionType: 'view_event',
        actionPayload: event.id,
        seen: false,
        createdAt: now,
      });
    }

    // 2. New members with shared interests
    const newMembers = await fetchNewMembers(context.username);
    for (const member of newMembers.slice(0, 2)) {
      const sharedInterests = (member.interests || []).filter(
        (i: string) => context.interests?.includes(i)
      );
      const sharedText = sharedInterests.length > 0
        ? ` Ihr teilt: ${sharedInterests.join(', ')}!`
        : '';
      notifications.push({
        id: `new_member_${member.username}`,
        type: 'new_member',
        text: `${member.username} ist neu in der Community!${sharedText} 👋`,
        avatarUrl: member.avatar || undefined,
        actionLabel: 'Profil checken',
        actionType: 'view_profile',
        actionPayload: member.username,
        seen: false,
        createdAt: now,
      });
    }

    // 3. Top events / daily recommendations
    const topEvents = await fetchTodaysTopEvents(city);
    const matchingEvents = topEvents.filter(e => {
      if (!context.interests?.length) return true;
      const cat = (e.category || '').toLowerCase();
      return context.interests.some(i => cat.includes(i.toLowerCase()));
    });

    if (matchingEvents.length > 0) {
      const top = matchingEvents[0];
      notifications.push({
        id: `recommendation_${top.id}`,
        type: 'daily_recommendation',
        text: `Dein Tipp: "${top.title}" – passt perfekt zu dir! ${top.likes ? `❤️ ${top.likes} Likes` : '🔥'}`,
        actionLabel: 'Event ansehen',
        actionType: 'view_event',
        actionPayload: top.id,
        seen: false,
        createdAt: now,
      });
    }

    // 4. User activity hints (with avatar lookup)
    const activity = await fetchRecentUserActivity(context.username);
    const eventClicks = activity.filter(a => {
      try {
        const data = typeof a.event_data === 'string' ? JSON.parse(a.event_data) : a.event_data;
        return data?.eventTitle;
      } catch { return false; }
    });

    if (eventClicks.length > 0) {
      const click = eventClicks[0];
      const data = typeof click.event_data === 'string' ? JSON.parse(click.event_data) : click.event_data;

      // Fetch avatar for active user
      let activityAvatar: string | undefined;
      try {
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('avatar')
          .eq('username', click.username)
          .single();
        activityAvatar = profile?.avatar || undefined;
      } catch {}

      notifications.push({
        id: `activity_${click.username}_${Date.now()}`,
        type: 'user_activity',
        text: `${click.username} checkt gerade "${data.eventTitle}" – vielleicht auch was für dich? 👀`,
        avatarUrl: activityAvatar,
        actionLabel: 'Event ansehen',
        actionType: 'view_event',
        actionPayload: data.eventId || '',
        seen: false,
        createdAt: now,
      });
    }

    // 5. Event reminders for liked/RSVP events happening today or tomorrow
    const savedEventIds = [
      ...(context.likedEventIds || []),
      ...(context.attendingEventIds || []),
    ];
    const uniqueEventIds = [...new Set(savedEventIds)];

    if (uniqueEventIds.length > 0) {
      const today = new Date();
      const todayStr = today.toISOString().split('T')[0];
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowStr = tomorrow.toISOString().split('T')[0];

      // Fetch events happening today or tomorrow that user liked/RSVP'd
      const { data: reminderEvents } = await supabase
        .from('community_events')
        .select('id, title, date, time, location')
        .in('id', uniqueEventIds.slice(0, 20))
        .gte('date', todayStr)
        .lte('date', tomorrowStr)
        .order('date', { ascending: true })
        .limit(3);

      for (const event of (reminderEvents || [])) {
        const isToday = event.date === todayStr;
        const timeText = event.time ? ` um ${event.time}` : '';
        const locationText = event.location ? ` in ${event.location}` : '';
        notifications.push({
          id: `reminder_${event.id}_${todayStr}`,
          type: 'event_reminder',
          text: isToday
            ? `⏰ Reminder: "${event.title}" ist HEUTE${timeText}${locationText}! Nicht vergessen 🎶`
            : `📅 Morgen steht "${event.title}"${timeText}${locationText} an – bist du ready? 🔥`,
          actionLabel: 'Event ansehen',
          actionType: 'view_event',
          actionPayload: event.id,
          seen: false,
          createdAt: now,
        });
      }
    }
  } catch (error) {
    console.error('Error generating notifications:', error);
  }

  return notifications;
};

/**
 * Generate AI-enhanced notifications via edge function
 */
export const generateAINotifications = async (
  context: NotificationContext,
  city?: string
): Promise<MiaNotification[]> => {
  try {
    const [newEvents, newMembers, topEvents] = await Promise.all([
      fetchRecentNewEvents(city),
      fetchNewMembers(context.username),
      fetchTodaysTopEvents(city),
    ]);

    const { data, error } = await supabase.functions.invoke('mia-notifications', {
      body: {
        userProfile: context,
        newEvents,
        newMembers,
        topEvents,
        city,
      },
    });

    if (error) {
      console.error('MIA notifications edge function error:', error);
      return generateLocalNotifications(context, city);
    }

    return (data?.notifications || []).map((n: any, idx: number) => ({
      id: `ai_${Date.now()}_${idx}`,
      type: n.type || 'daily_recommendation',
      text: n.text,
      actionLabel: n.actionLabel || 'Mehr Info',
      actionType: n.actionType || 'chat_mia',
      actionPayload: n.actionPayload || '',
      seen: false,
      createdAt: new Date().toISOString(),
    }));
  } catch (error) {
    console.error('AI notification generation failed, falling back to local:', error);
    return generateLocalNotifications(context, city);
  }
};
