
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
      
      // Stellen Sie sicher, dass der Avatar-Bucket existiert
      await userService.ensureAvatarBucket();
      
      const avatar = localStorage.getItem(AVATAR_KEY);
      
      // Versuche zuerst, das Benutzerprofil zu finden
      let profile;
      try {
        profile = await userService.getUserByUsername(currentUser);
        console.log('Found existing user profile:', profile);
      } catch (err) {
        console.log('User does not exist yet, will create new profile');
      }
      
      // Nur versuchen zu erstellen/aktualisieren, wenn wir kein Gast sind
      if (currentUser !== 'Gast') {
        try {
          // Benutzerprofil erstellen oder aktualisieren mit allen benötigten Feldern
          profile = await userService.createOrUpdateProfile({
            username: currentUser,
            avatar: avatar || null,
            interests: profile?.interests || [],
            favorite_locations: profile?.favorite_locations || []
          });
          
          setUserProfile(profile);
          console.log('Profile initialized successfully:', profile);
        } catch (err: any) {
          console.error('Fehler beim Erstellen des Benutzerprofils:', err);
          
          // Wenn wir einen RLS-Fehler erhalten, versuchen wir, das Profil erneut abzurufen
          if (err.message && err.message.includes('row-level security policy')) {
            try {
              profile = await userService.getUserByUsername(currentUser);
              if (profile) {
                console.log('Retrieved profile after RLS error:', profile);
                setUserProfile(profile);
              }
            } catch (getErr) {
              console.error('Failed to retrieve profile after RLS error:', getErr);
              throw err; // Wirf den ursprünglichen Fehler
            }
          } else {
            throw err;
          }
        }
      }
    } catch (err: any) {
      console.error('Fehler beim Initialisieren des Benutzerprofils:', err);
      setError(err.message || 'Ein Fehler ist aufgetreten');
      
      // Nur Toast anzeigen, wenn es kein RLS-Policy-Fehler ist
      if (!err.message || !err.message.includes('row-level security policy')) {
        toast({
          title: "Fehler",
          description: "Benutzerprofil konnte nicht erstellt werden. Bitte später erneut versuchen.",
          variant: "destructive"
        });
      }
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
