
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
      const profile = await userService.getUserByUsername(username);
      
      if (profile) {
        if (profile.interests && profile.interests.length > 0) {
          localStorage.setItem('user_interests', JSON.stringify(profile.interests));
        }
        
        if (profile.favorite_locations && profile.favorite_locations.length > 0) {
          localStorage.setItem('user_locations', JSON.stringify(profile.favorite_locations));
        } else {
          localStorage.removeItem('user_locations');
        }
        
        setUserProfile(profile);
      } else {
        setUserProfile(null);
        localStorage.removeItem('user_interests');
        localStorage.removeItem('user_locations');
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
      let usernameToFetch = currentUser;
      
      try {
        const storedUsername = localStorage.getItem(USERNAME_KEY);
        if (storedUsername && storedUsername !== currentUser) {
          setCurrentUser(storedUsername);
          usernameToFetch = storedUsername;
        }
      } catch (err) {
        console.error('[useUserProfile] Error accessing localStorage:', err);
      }
      
      if (usernameToFetch && usernameToFetch !== 'Gast') {
        const profile = await fetchProfile(usernameToFetch);
        return profile;
      } else {
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
        let storedUsername = null;
        try {
          storedUsername = localStorage.getItem(USERNAME_KEY);
        } catch (localStorageError) {
          console.error("[useUserProfile] Error accessing localStorage:", localStorageError);
        }

        if (storedUsername) {
          setCurrentUser(storedUsername);
          await fetchProfile(storedUsername);
        } else {
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
