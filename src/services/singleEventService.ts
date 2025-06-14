
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
          description: '',
          date: new Date().toISOString().split('T')[0],
          time: '00:00',
          location: 'GitHub',
          organizer: '',
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
          description: communityData.description || '',
          date: communityData.date,
          time: communityData.time?.toString() || '00:00',
          location: communityData.location || '',
          organizer: communityData.organizer || '',
          category: communityData.category,
          link: communityData.link,
          image_url: communityData.image_urls?.[0] || undefined,
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

export const updateEventLikesInDb = async (eventId: string, newLikes: number): Promise<boolean> => {
  try {
    console.log(`Updating likes for event ${eventId} to ${newLikes}`);
    
    if (eventId.startsWith('github-')) {
      // For GitHub events: use upsert with correct onConflict
      const { error } = await supabase
        .from('github_event_likes')
        .upsert({
          event_id: eventId,
          likes: newLikes,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'event_id'
        });
      
      if (error) {
        console.error('Error updating GitHub event likes:', error);
        return false;
      }
    } else {
      // For Community events: use simple update
      const { error } = await supabase
        .from('community_events')
        .update({ likes: newLikes })
        .eq('id', eventId);
      
      if (error) {
        console.error('Error updating community event likes:', error);
        return false;
      }
    }
    
    console.log(`Successfully updated likes for event ${eventId} to ${newLikes}`);
    return true;
  } catch (error) {
    console.error('Error in updateEventLikesInDb:', error);
    return false;
  }
};
