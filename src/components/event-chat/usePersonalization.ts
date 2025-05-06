
import { useState } from 'react';
import { toast } from 'sonner';
import { generatePersonalizedPrompt } from '@/utils/chatUtils';
import { PersonalizationOptions } from './types';

export const usePersonalization = (
  handleSendMessage: (input?: string) => Promise<void>,
  options: PersonalizationOptions
) => {
  const { userProfile, currentUser, userService } = options;

  const sendPersonalizedQuery = async () => {
    try {
      // Get user interests and locations from the user profile
      let userInterests: string[] = [];
      let userLocations: string[] = [];
      
      if (userProfile) {
        // If we have a user profile, use those interests and locations
        userInterests = userProfile.interests || [];
        userLocations = userProfile.favorite_locations || [];
        
        // Save to localStorage for future use
        if (userInterests.length > 0) {
          localStorage.setItem('user_interests', JSON.stringify(userInterests));
        }
        
        if (userLocations.length > 0) {
          localStorage.setItem('user_locations', JSON.stringify(userLocations));
        }
      } else if (currentUser !== 'Gast') {
        // If we have a username but no profile loaded yet, try to fetch it
        try {
          const profile = await userService.getUserByUsername(currentUser);
          if (profile) {
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
          console.error('Error fetching user profile for personalization:', err);
        }
      } else {
        // Fallback to localStorage if no profile is available
        userInterests = localStorage.getItem('user_interests')
          ? JSON.parse(localStorage.getItem('user_interests') || '[]')
          : [];
          
        userLocations = localStorage.getItem('user_locations')
          ? JSON.parse(localStorage.getItem('user_locations') || '[]')
          : [];
      }
      
      // If we still don't have interests or locations, use fallbacks
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
      console.error('Error in personalized recommendations:', error);
      toast.error("Konnte keine personalisierten Empfehlungen laden");
    }
  };

  return { sendPersonalizedQuery };
};
