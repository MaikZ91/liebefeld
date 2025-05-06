
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { UserProfile, USERNAME_KEY, AVATAR_KEY } from '@/types/chatTypes';
import { userService } from '@/services/userService';

export const useUserProfile = () => {
  const [currentUser, setCurrentUser] = useState<string | null>('Gast');
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchProfile = async (username: string) => {
    try {
      console.log(`[useUserProfile] Fetching profile for username: ${username}`);
      const profile = await userService.getUserByUsername(username);
      
      if (profile) {
        console.log('[useUserProfile] Profile fetched successfully:', profile);
        console.log('[useUserProfile] Interests:', profile.interests || []);
        console.log('[useUserProfile] Favorite locations:', profile.favorite_locations || []);
        
        // Store in localStorage as backup
        if (profile.interests && profile.interests.length > 0) {
          localStorage.setItem('user_interests', JSON.stringify(profile.interests));
        }
        
        if (profile.favorite_locations && profile.favorite_locations.length > 0) {
          localStorage.setItem('user_locations', JSON.stringify(profile.favorite_locations));
        }
        
        setUserProfile(profile);
      } else {
        console.log('[useUserProfile] No profile found for username:', username);
        setUserProfile(null);
      }
      
      return profile;
    } catch (err) {
      console.error('[useUserProfile] Error fetching user profile:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch user profile'));
      return null;
    }
  };

  const refetchProfile = async () => {
    setLoading(true);
    try {
      // Get the latest username from localStorage
      let usernameToFetch = currentUser;
      
      try {
        const storedUsername = localStorage.getItem(USERNAME_KEY);
        if (storedUsername && storedUsername !== currentUser) {
          console.log(`[useUserProfile] Updating current user from ${currentUser} to ${storedUsername}`);
          setCurrentUser(storedUsername);
          usernameToFetch = storedUsername;
        }
      } catch (err) {
        console.error('[useUserProfile] Error accessing localStorage:', err);
      }
      
      if (usernameToFetch && usernameToFetch !== 'Gast') {
        console.log(`[useUserProfile] Fetching profile for user: ${usernameToFetch}`);
        const profile = await fetchProfile(usernameToFetch);
        return profile;
      } else {
        console.log('[useUserProfile] No username to fetch profile for, setting profile to null');
        setUserProfile(null);
        return null;
      }
    } finally {
      setLoading(false);
    }
  };

  // Add an alias for refetchProfile to maintain compatibility
  const refreshUserProfile = refetchProfile;

  useEffect(() => {
    const getSession = async () => {
      setLoading(true);
      try {
        // Safely access localStorage
        let storedUsername = null;
        try {
          storedUsername = localStorage.getItem(USERNAME_KEY);
          console.log('[useUserProfile] Initial username from localStorage:', storedUsername);
        } catch (localStorageError) {
          console.error("[useUserProfile] Error accessing localStorage:", localStorageError);
        }

        if (storedUsername) {
          console.log(`[useUserProfile] Setting current user to: ${storedUsername}`);
          setCurrentUser(storedUsername);
          await fetchProfile(storedUsername);
        } else {
          console.log('[useUserProfile] No stored username found, setting user to Guest');
          setCurrentUser('Gast');
          setUserProfile(null);
        }
      } catch (err) {
        console.error('[useUserProfile] Error during session initialization:', err);
        setError(err instanceof Error ? err : new Error('Failed to initialize session'));
      } finally {
        setLoading(false);
      }
    };

    getSession();
  }, []);

  return { currentUser, userProfile, loading, error, refetchProfile, refreshUserProfile };
};
