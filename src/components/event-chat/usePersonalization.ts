
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { generatePersonalizedPrompt } from '@/utils/chatUtils';
import { PersonalizationOptions } from './types';

export const usePersonalization = (
  handleSendMessage: (input?: string) => Promise<void>,
  options: PersonalizationOptions
) => {
  const { userProfile, currentUser, userService } = options;
  const [isLoading, setIsLoading] = useState(false);

  // Function to ensure we have the latest user profile data
  const refreshUserData = async () => {
    if (!currentUser || currentUser === 'Gast') {
      console.log('[usePersonalization] No current user, returning null');
      return null;
    }
    
    try {
      console.log(`[usePersonalization] Explicitly fetching latest profile data for user: ${currentUser}`);
      const profile = await userService.getUserByUsername(currentUser);
      console.log('[usePersonalization] Latest profile data fetched:', profile);
      
      // Store in localStorage for backup
      if (profile?.interests && profile.interests.length > 0) {
        localStorage.setItem('user_interests', JSON.stringify(profile.interests));
        console.log('[usePersonalization] Stored interests in localStorage:', profile.interests);
      }
      
      if (profile?.favorite_locations && profile.favorite_locations.length > 0) {
        localStorage.setItem('user_locations', JSON.stringify(profile.favorite_locations));
        console.log('[usePersonalization] Stored locations in localStorage:', profile.favorite_locations);
      }
      
      return profile;
    } catch (err) {
      console.error('[usePersonalization] Error fetching latest user data:', err);
      return null;
    }
  };

  const sendPersonalizedQuery = async () => {
    setIsLoading(true);
    try {
      // First, always try to get the freshest data directly from the database
      const freshProfile = await refreshUserData();
      
      // Get user interests and locations - prioritize freshly fetched data
      let userInterests: string[] = [];
      let userLocations: string[] = [];
      
      if (freshProfile) {
        // Use the freshly fetched profile
        userInterests = freshProfile.interests || [];
        userLocations = freshProfile.favorite_locations || [];
        
        console.log('[usePersonalization] Using freshly fetched profile interests:', userInterests);
        console.log('[usePersonalization] Using freshly fetched profile locations:', userLocations);
      } else if (userProfile) {
        // Fall back to the profile from props if fresh fetch failed
        userInterests = userProfile.interests || [];
        userLocations = userProfile.favorite_locations || [];
        
        console.log('[usePersonalization] Using props profile interests:', userInterests);
        console.log('[usePersonalization] Using props profile locations:', userLocations);
      } else if (currentUser !== 'Gast') {
        // If we have a username but no profile loaded yet, try to fetch it
        try {
          console.log('[usePersonalization] Fetching user profile for personalization...');
          const profile = await userService.getUserByUsername(currentUser);
          
          if (profile) {
            console.log('[usePersonalization] Profile fetched successfully:', profile);
            userInterests = profile.interests || [];
            userLocations = profile.favorite_locations || [];
            
            // Save to localStorage
            if (userInterests.length > 0) {
              localStorage.setItem('user_interests', JSON.stringify(userInterests));
            }
            
            if (userLocations.length > 0) {
              localStorage.setItem('user_locations', JSON.stringify(userLocations));
            }
          }
        } catch (err) {
          console.error('[usePersonalization] Error fetching user profile for personalization:', err);
        }
      } else {
        // Fallback to localStorage if no profile is available
        try {
          const storedInterests = localStorage.getItem('user_interests');
          userInterests = storedInterests ? JSON.parse(storedInterests) : [];
          
          const storedLocations = localStorage.getItem('user_locations');
          userLocations = storedLocations ? JSON.parse(storedLocations) : [];
          
          console.log('[usePersonalization] Using localStorage interests:', userInterests);
          console.log('[usePersonalization] Using localStorage locations:', userLocations);
        } catch (err) {
          console.error('[usePersonalization] Error parsing stored preferences:', err);
          userInterests = [];
          userLocations = [];
        }
      }
      
      // If we still don't have interests or locations, use fallbacks
      if (!Array.isArray(userInterests) || userInterests.length === 0) {
        userInterests = ['Musik', 'Sport', 'Kultur'];
        console.log('[usePersonalization] Using fallback interests:', userInterests);
      }
      
      if (!Array.isArray(userLocations) || userLocations.length === 0) {
        userLocations = ['Liebefeld', 'Bern'];
        console.log('[usePersonalization] Using fallback locations:', userLocations);
      }
      
      // Validate data before sending
      console.log('[usePersonalization] FINAL DATA BEING SENT:');
      console.log('[usePersonalization] User interests:', JSON.stringify(userInterests));
      console.log('[usePersonalization] User locations:', JSON.stringify(userLocations));
      
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
