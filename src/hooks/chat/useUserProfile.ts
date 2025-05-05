
import { useState, useEffect } from 'react';
import { userService } from '@/services/userService';
import { UserProfile } from '@/types/chatTypes';
import { USERNAME_KEY, AVATAR_KEY } from '@/types/chatTypes';

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
      
      // Benutzerprofil erstellen oder aktualisieren
      const profile = await userService.createOrUpdateProfile({
        username: currentUser,
        avatar: avatar || null,
        // Standardwerte für Interessen und Hobbys
        interests: ['Sport', 'Events', 'Kreativität'],
        hobbies: ['Tanzen', 'Musik', 'Kochen']
      });
      
      setUserProfile(profile);
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
    updateLastOnline
  };
};
