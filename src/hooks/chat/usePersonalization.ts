
import { useState } from 'react';
import { toast } from 'sonner';
import { generatePersonalizedPrompt } from '@/utils/chatUtils';
import { PersonalizationOptions } from './types';
import { UserProfile } from '@/types/chatTypes';

export const usePersonalization = (
  handleSendMessage: (input?: string) => Promise<void>,
  options: PersonalizationOptions
) => {
  const { userProfile, currentUser, userService } = options;
  const [isLoading, setIsLoading] = useState(false);

  const sendPersonalizedQuery = async () => {
    setIsLoading(true);
    try {
      let profile: UserProfile | null = userProfile;

      // If we don't have a profile from props, try to fetch it.
      // The service layer will handle caching.
      if (!profile && currentUser && currentUser !== 'Gast') {
        profile = await userService.getUserByUsername(currentUser);
      }

      let userInterests = profile?.interests ?? [];
      let userLocations = profile?.favorite_locations ?? [];
      
      // Fallbacks if no data is available
      if (userInterests.length === 0) {
        userInterests = ['Musik', 'Sport', 'Kultur'];
      }
      
      if (userLocations.length === 0) {
        userLocations = ['Liebefeld', 'Bern'];
      }
      
      // Generate personalized prompt
      const personalizedPrompt = generatePersonalizedPrompt(userInterests, userLocations);
      
      // Show a toast notification
      toast.success("Suche passende Events für dich...");
      
      // Send the personalized prompt to the chat
      await handleSendMessage(personalizedPrompt);
    } catch (error) {
      console.error('[usePersonalization] Error in personalized recommendations:', error);
      toast.error("Konnte keine personalisierten Empfehlungen laden");
    } finally {
      setIsLoading(false);
    }
  };

  return { sendPersonalizedQuery, isLoading };
};
