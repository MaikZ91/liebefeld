
import { useState, useEffect } from 'react';
import { userService } from '@/services/userService';
import { UserProfile } from '@/types/chatTypes';
import { USERNAME_KEY, AVATAR_KEY } from '@/types/chatTypes';
import { toast } from '@/hooks/use-toast';

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
      
      // Check if user exists before trying to create/update
      let profile;
      try {
        profile = await userService.getUserByUsername(currentUser);
      } catch (err) {
        console.log('User does not exist yet, will create new profile');
      }
      
      // Benutzerprofil erstellen oder aktualisieren
      profile = await userService.createOrUpdateProfile({
        username: currentUser,
        avatar: avatar || null,
        // Standardwerte für Interessen und Hobbys
        interests: ['Sport', 'Events', 'Kreativität'],
        hobbies: ['Tanzen', 'Musik', 'Kochen'],
        favorite_locations: profile?.favorite_locations || []
      });
      
      setUserProfile(profile);
    } catch (err: any) {
      console.error('Fehler beim Initialisieren des Benutzerprofils:', err);
      setError(err.message || 'Ein Fehler ist aufgetreten');
      toast({
        title: "Fehler",
        description: "Benutzerprofil konnte nicht erstellt werden. Bitte später erneut versuchen.",
        variant: "destructive"
      });
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
