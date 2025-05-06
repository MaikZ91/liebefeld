
import { useState, useEffect } from 'react';
import { userService } from '@/services/userService';
import { UserProfile } from '@/types/chatTypes';
import { USERNAME_KEY, AVATAR_KEY } from '@/types/chatTypes';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

export const useUserProfile = () => {
  const [currentUser, setCurrentUser] = useState<string>(() => localStorage.getItem(USERNAME_KEY) || 'Gast');
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Benutzerprofil erstellen oder aktualisieren, wenn der Benutzername bekannt ist
  useEffect(() => {
    if (currentUser !== 'Gast') {
      initializeProfile();
    }
  }, [currentUser]);
  
  // Benutzerprofil initialisieren
  const initializeProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const avatar = localStorage.getItem(AVATAR_KEY);
      
      // Check if user profile already exists
      let profile = await userService.getUserByUsername(currentUser);
      
      if (currentUser !== 'Gast') {
        try {
          // Benutzerprofil erstellen oder aktualisieren
          const profileData = {
            username: currentUser,
            avatar: avatar || null,
            interests: profile?.interests || ['Sport', 'Events', 'Kreativität'],
            hobbies: profile?.hobbies || ['Tanzen', 'Musik', 'Kochen'],
            favorite_locations: profile?.favorite_locations || []
          };
          
          profile = await userService.createOrUpdateProfile(profileData);
          setUserProfile(profile);
          
        } catch (err: any) {
          console.error('Fehler beim Erstellen des Benutzerprofils:', err);
          
          // Try to fetch profile again if creation failed, in case it exists
          if (!profile) {
            try {
              profile = await userService.getUserByUsername(currentUser);
              if (profile) {
                setUserProfile(profile);
              }
            } catch (getErr) {
              console.error('Fehler beim erneuten Abrufen des Profils:', getErr);
            }
          }
          
          setError(err.message || 'Ein Fehler ist aufgetreten');
          toast({
            title: "Fehler", 
            description: "Benutzerprofil konnte nicht erstellt werden. Bitte später erneut versuchen.",
            variant: "destructive"
          });
        }
      }
    } catch (err: any) {
      console.error('Fehler beim Initialisieren des Benutzerprofils:', err);
      setError(err.message || 'Ein Fehler ist aufgetreten');
    } finally {
      setLoading(false);
    }
  };
  
  // Online-Status aktualisieren
  const updateLastOnline = async () => {
    if (currentUser !== 'Gast') {
      try {
        await userService.updateLastOnline(currentUser);
      } catch (err) {
        console.error('Fehler beim Aktualisieren der letzten Online-Zeit:', err);
      }
    }
  };
  
  // Benutzerprofil aktualisieren nach Änderungen
  const refreshUserProfile = async () => {
    if (currentUser !== 'Gast') {
      await initializeProfile();
    }
  };
  
  // Online-Status beim Initialisieren und regelmäßig aktualisieren
  useEffect(() => {
    if (currentUser !== 'Gast') {
      updateLastOnline();
      
      // Online-Status alle 5 Minuten aktualisieren
      const interval = setInterval(updateLastOnline, 5 * 60 * 1000);
      
      return () => clearInterval(interval);
    }
  }, [currentUser]);
  
  return {
    currentUser,
    userProfile,
    loading,
    error,
    updateLastOnline,
    refreshUserProfile
  };
};
