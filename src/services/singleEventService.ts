
import { supabase } from '@/integrations/supabase/client';
import { Event } from '@/types/eventTypes';

export const refetchSingleEvent = async (eventId: string): Promise<Event | null> => {
  try {
    console.log(`Refetching single event: ${eventId}`);
    
    // Check if it's a GitHub event
    if (eventId.startsWith('github-')) {
      const { data: githubData, error: githubError } = await supabase
        .from('github_event_likes')
        .select('*')
        .eq('event_id', eventId)
        .single();
      
      if (githubError && githubError.code !== 'PGRST116') {
        console.error('Error fetching GitHub event:', githubError);
        return null;
      }
      
      if (githubData) {
        return {
          id: eventId,
          title: `GitHub Event ${eventId}`,
          date: new Date().toISOString().split('T')[0],
          time: '00:00',
          location: 'GitHub',
          category: 'Sonstiges',
          likes: githubData.likes || 0,
          rsvp_yes: githubData.rsvp_yes || 0,
          rsvp_no: githubData.rsvp_no || 0,
          rsvp_maybe: githubData.rsvp_maybe || 0
        };
      }
    } else {
      // Community event
      const { data: communityData, error: communityError } = await supabase
        .from('community_events')
        .select('*')
        .eq('id', eventId)
        .single();
      
      if (communityError) {
        console.error('Error fetching community event:', communityError);
        return null;
      }
      
      if (communityData) {
        return {
          id: communityData.id,
          title: communityData.title,
          description: communityData.description,
          date: communityData.date,
          time: communityData.time?.toString() || '00:00',
          location: communityData.location || '',
          category: communityData.category,
          organizer: communityData.organizer,
          link: communityData.link,
          image_urls: communityData.image_urls,
          likes: communityData.likes || 0,
          rsvp_yes: communityData.rsvp_yes || 0,
          rsvp_no: communityData.rsvp_no || 0,
          rsvp_maybe: communityData.rsvp_maybe || 0
        };
      }
    }
    
    return null;
  } catch (error) {
    console.error('Error in refetchSingleEvent:', error);
    return null;
  }
};

export const updateEventLikesInDb = async (eventId: string, newLikes: number) => {
  try {
    console.log(`Updating likes for event ${eventId} to ${newLikes}`);
    
    if (eventId.startsWith('github-')) {
      // Update GitHub event likes
      const { error } = await supabase
        .from('github_event_likes')
        .upsert({
          event_id: eventId,
          likes: newLikes,
          updated_at: new Date().toISOString()
        });
      
      if (error) {
        console.error('Error updating GitHub event likes:', error);
        throw error;
      }
    } else {
      // Update community event likes
      const { error } = await supabase
        .from('community_events')
        .update({ likes: newLikes })
        .eq('id', eventId);
      
      if (error) {
        console.error('Error updating community event likes:', error);
        throw error;
      }
    }
    
    console.log(`Successfully updated likes for event ${eventId}`);
  } catch (error) {
    console.error('Error in updateEventLikesInDb:', error);
    throw error;
  }
};
