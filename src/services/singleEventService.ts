
import { supabase } from "@/integrations/supabase/client";

export const updateEventLikesInDb = async (eventId: string, newLikesValue: number): Promise<boolean> => {
  try {
    console.log(`🔥 [updateEventLikesInDb] STARTING - Event: ${eventId}, New Likes: ${newLikesValue}`);
    
    // First, check current value in DB
    const { data: currentData, error: selectError } = await supabase
      .from('community_events')
      .select('likes, title')
      .eq('id', eventId)
      .single();
    
    if (selectError) {
      console.error(`🔥 [updateEventLikesInDb] SELECT ERROR:`, selectError);
      return false;
    }
    
    console.log(`🔥 [updateEventLikesInDb] CURRENT DB VALUE: ${currentData?.likes} for "${currentData?.title}"`);
    
    // Perform the update
    const updateStartTime = Date.now();
    const { error: updateError, data: updateData } = await supabase
      .from('community_events')
      .update({ likes: newLikesValue })
      .eq('id', eventId)
      .select('likes, title');
      
    const updateDuration = Date.now() - updateStartTime;
    
    if (updateError) {
      console.error(`🔥 [updateEventLikesInDb] UPDATE ERROR:`, updateError);
      return false;
    }
    
    console.log(`🔥 [updateEventLikesInDb] UPDATE SUCCESS in ${updateDuration}ms:`, updateData);
    
    // Verify the update immediately
    const { data: verifyData, error: verifyError } = await supabase
      .from('community_events')
      .select('likes, title')
      .eq('id', eventId)
      .single();
    
    if (verifyError) {
      console.error(`🔥 [updateEventLikesInDb] VERIFY ERROR:`, verifyError);
      return false;
    }
    
    console.log(`🔥 [updateEventLikesInDb] VERIFICATION: DB now shows ${verifyData?.likes} likes for "${verifyData?.title}"`);
    
    if (verifyData?.likes !== newLikesValue) {
      console.error(`🔥 [updateEventLikesInDb] MISMATCH! Expected ${newLikesValue}, got ${verifyData?.likes}`);
      return false;
    }
    
    console.log(`🔥 [updateEventLikesInDb] COMPLETED SUCCESSFULLY ✅`);
    return true;
  } catch (error) {
    console.error(`🔥 [updateEventLikesInDb] EXCEPTION:`, error);
    return false;
  }
};
