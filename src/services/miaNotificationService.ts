import { supabase } from '@/integrations/supabase/client';

export interface MiaNotification {
  id: string;
  type: 'new_event' | 'user_activity' | 'new_member' | 'upcoming_tribe' | 'daily_recommendation' | 'event_like' | 'event_reminder' | 'community_match';
  text: string;
  avatarUrl?: string;
  matchAvatars?: string[]; // Multiple avatars for community match notifications
  matchCount?: number; // Number of matched community members
  actionLabel?: string;
  actionType?: 'view_event' | 'view_profile' | 'rsvp' | 'create_event' | 'chat_mia' | 'join_community_chat';
  actionPayload?: string;
  secondaryActionLabel?: string;
  secondaryActionType?: 'view_event' | 'join_community_chat';
  secondaryActionPayload?: string;
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
 * Calculate match score between two user profiles
 */
const calculateMatchScore = (
  currentInterests: string[],
  currentHobbies: string[],
  currentLocations: string[],
  other: { interests?: string[] | null; hobbies?: string[] | null; favorite_locations?: string[] | null }
): { score: number; sharedInterests: string[] } => {
  let score = 0;
  let factors = 0;
  const sharedInterests: string[] = [];

  const otherInterests = other.interests || [];
  if (currentInterests.length > 0 && otherInterests.length > 0) {
    const common = currentInterests.filter(i => otherInterests.includes(i));
    sharedInterests.push(...common);
    score += (common.length / Math.max(currentInterests.length, otherInterests.length)) * 100;
    factors++;
  }

  const otherLocations = other.favorite_locations || [];
  if (currentLocations.length > 0 && otherLocations.length > 0) {
    const common = currentLocations.filter(l => otherLocations.includes(l));
    score += (common.length / Math.max(currentLocations.length, otherLocations.length)) * 100;
    factors++;
  }

  const otherHobbies = other.hobbies || [];
  if (currentHobbies.length > 0 && otherHobbies.length > 0) {
    const common = currentHobbies.filter(h => otherHobbies.includes(h));
    score += (common.length / Math.max(currentHobbies.length, otherHobbies.length)) * 100;
    factors++;
  }

  return { score: factors > 0 ? Math.round(score / factors) : 0, sharedInterests };
};

/**
 * Generate community match notifications - groups users with shared interests and connects them to events
 */
export const generateCommunityMatchNotifications = async (
  context: NotificationContext,
  city?: string
): Promise<MiaNotification[]> => {
  const notifications: MiaNotification[] = [];

  try {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

    // 1. Load active users (last 7 days, not guest, not self)
    const { data: activeUsers } = await supabase
      .from('user_profiles')
      .select('username, avatar, interests, hobbies, favorite_locations, last_online')
      .gte('last_online', sevenDaysAgo)
      .neq('username', context.username)
      .not('username', 'like', 'Guest_%')
      .order('last_online', { ascending: false })
      .limit(20);

    if (!activeUsers || activeUsers.length === 0) return [];

    const currentInterests = context.interests || [];
    const currentHobbies = context.hobbies || [];
    const currentLocations = context.favorite_locations || [];

    // 2. Calculate match scores and find users with score >= 40%
    const matchedUsers = activeUsers
      .map(user => {
        const { score, sharedInterests } = calculateMatchScore(
          currentInterests, currentHobbies, currentLocations, user
        );
        return { ...user, matchScore: score, sharedInterests };
      })
      .filter(u => u.matchScore >= 40)
      .sort((a, b) => b.matchScore - a.matchScore);

    if (matchedUsers.length === 0) return [];

    // 3. Group by shared interest categories
    const interestGroups = new Map<string, typeof matchedUsers>();
    for (const user of matchedUsers) {
      for (const interest of user.sharedInterests) {
        const group = interestGroups.get(interest) || [];
        group.push(user);
        interestGroups.set(interest, group);
      }
    }

    // 4. Fetch upcoming events (next 3 days)
    const today = new Date().toISOString().split('T')[0];
    const threeDays = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    let eventQuery = supabase
      .from('community_events')
      .select('id, title, category, date, time, location')
      .gte('date', today)
      .lte('date', threeDays)
      .order('date', { ascending: true })
      .limit(20);

    if (city && city !== 'Deutschland') {
      eventQuery = eventQuery.ilike('city', city);
    }

    const { data: upcomingEvents } = await eventQuery;

    // 5. Generate notifications: match interest groups with events
    let notificationCount = 0;
    const now = new Date().toISOString();

    for (const [interest, users] of interestGroups) {
      if (notificationCount >= 2) break;

      // Find an event that matches this interest category
      const matchingEvent = (upcomingEvents || []).find(e => {
        const cat = (e.category || '').toLowerCase();
        const title = (e.title || '').toLowerCase();
        return cat.includes(interest.toLowerCase()) || title.includes(interest.toLowerCase());
      });

      const avatars = users.slice(0, 4).map(u => u.avatar || '').filter(Boolean);
      const count = users.length;

      if (matchingEvent) {
        notifications.push({
          id: `community_match_${interest}_${matchingEvent.id}`,
          type: 'community_match',
          text: `${count + 1} Leute aus der Community mögen ${interest} – „${matchingEvent.title}" am ${matchingEvent.date} wäre perfekt für euch! 🎯`,
          matchAvatars: avatars,
          matchCount: count,
          actionLabel: 'Event ansehen',
          actionType: 'view_event',
          actionPayload: matchingEvent.id,
          secondaryActionLabel: 'Community Chat',
          secondaryActionType: 'join_community_chat',
          seen: false,
          createdAt: now,
        });
      } else {
        notifications.push({
          id: `community_match_${interest}_${Date.now()}`,
          type: 'community_match',
          text: `${count + 1} Leute in der Community teilen dein Interesse an ${interest} – tausch dich im Chat aus! 💬`,
          matchAvatars: avatars,
          matchCount: count,
          actionLabel: 'Community Chat',
          actionType: 'join_community_chat',
          seen: false,
          createdAt: now,
        });
      }
      notificationCount++;
    }
  } catch (error) {
    console.error('Error generating community match notifications:', error);
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
