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
      setUserProfile(profile);
    } catch (err) {
      console.error('Error fetching user profile:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch user profile'));
    }
  };

  const refetchProfile = async () => {
    setLoading(true);
    try {
      if (currentUser && currentUser !== 'Gast') {
        await fetchProfile(currentUser);
      } else {
        setUserProfile(null);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const getSession = async () => {
      setLoading(true);
      try {
        // Safely access localStorage
        let storedUsername = null;
        try {
          storedUsername = localStorage.getItem(USERNAME_KEY);
        } catch (localStorageError) {
          console.error("Error accessing localStorage:", localStorageError);
        }

        if (storedUsername) {
          setCurrentUser(storedUsername);
          await fetchProfile(storedUsername);
        } else {
          setCurrentUser('Gast');
          setUserProfile(null);
        }
      } catch (err) {
        console.error('Error during session initialization:', err);
        setError(err instanceof Error ? err : new Error('Failed to initialize session'));
      } finally {
        setLoading(false);
      }
    };

    getSession();
  }, []);

  return { currentUser, userProfile, loading, error, refetchProfile };
};
