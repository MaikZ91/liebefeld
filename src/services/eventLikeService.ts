import { supabase } from '@/integrations/supabase/client';
import { getRandomAvatar } from '@/utils/chatUIUtils';

export interface EventLike {
  id: string;
  event_id: string;
  user_id: string | null;
  username: string | null;
  avatar_url: string | null;
  created_at: string;
}

export interface LikeEventParams {
  eventId: string;
  userId?: string | null;
  username?: string | null;
  avatarUrl?: string | null;
}

/**
 * Add a like to an event
 */
export const likeEvent = async ({ eventId, userId, username, avatarUrl }: LikeEventParams) => {
  try {
    // For anonymous users, generate a random avatar
    const finalAvatarUrl = avatarUrl || (userId ? null : getRandomAvatar());
    
    const { data, error } = await supabase
      .from('event_likes')
      .insert({
        event_id: eventId,
        user_id: userId,
        username: username,
        avatar_url: finalAvatarUrl
      })
      .select()
      .single();

    if (error) {
      console.error('Error liking event:', error);
      return { data: null, error };
    }

    return { data, error: null };
  } catch (error) {
    console.error('Error in likeEvent:', error);
    return { data: null, error };
  }
};

/**
 * Remove a like from an event
 */
export const unlikeEvent = async ({ eventId, userId }: { eventId: string; userId?: string | null }) => {
  try {
    const query = supabase
      .from('event_likes')
      .delete()
      .eq('event_id', eventId);

    // If user is logged in, delete by user_id, otherwise delete any anonymous like from this session
    if (userId) {
      query.eq('user_id', userId);
    } else {
      query.is('user_id', null);
    }

    const { error } = await query;

    if (error) {
      console.error('Error unliking event:', error);
      return { error };
    }

    return { error: null };
  } catch (error) {
    console.error('Error in unlikeEvent:', error);
    return { error };
  }
};

/**
 * Get all likes for an event
 */
export const getEventLikes = async (eventId: string): Promise<{ data: EventLike[] | null; error: any }> => {
  try {
    const { data, error } = await supabase
      .from('event_likes')
      .select('*')
      .eq('event_id', eventId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching event likes:', error);
      return { data: null, error };
    }

    return { data: data as EventLike[], error: null };
  } catch (error) {
    console.error('Error in getEventLikes:', error);
    return { data: null, error };
  }
};

/**
 * Check if user has liked an event
 */
export const hasUserLikedEvent = async (eventId: string, userId?: string | null): Promise<boolean> => {
  try {
    const query = supabase
      .from('event_likes')
      .select('id')
      .eq('event_id', eventId);

    if (userId) {
      query.eq('user_id', userId);
    } else {
      query.is('user_id', null);
    }

    const { data, error } = await query.single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error checking if user liked event:', error);
      return false;
    }

    return !!data;
  } catch (error) {
    console.error('Error in hasUserLikedEvent:', error);
    return false;
  }
};

/**
 * Get like count for an event
 */
export const getEventLikeCount = async (eventId: string): Promise<number> => {
  try {
    const { data, error } = await supabase
      .from('event_likes')
      .select('id', { count: 'exact' })
      .eq('event_id', eventId);

    if (error) {
      console.error('Error getting event like count:', error);
      return 0;
    }

    return data?.length || 0;
  } catch (error) {
    console.error('Error in getEventLikeCount:', error);
    return 0;
  }
};