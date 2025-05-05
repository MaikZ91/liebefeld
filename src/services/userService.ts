
import { supabase } from '@/integrations/supabase/client';
import { UserProfile } from '@/types/chatTypes';

export const userService = {
  /**
   * Benutzerprofile abrufen
   */
  async getUsers(): Promise<UserProfile[]> {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .order('last_online', { ascending: false });
      
    if (error) {
      console.error('Fehler beim Abrufen von Benutzerprofilen:', error);
      throw error;
    }
    
    return data || [];
  },
  
  /**
   * Ein einzelnes Benutzerprofil abrufen
   */
  async getUserByUsername(username: string): Promise<UserProfile | null> {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('username', username)
      .single();
      
    if (error) {
      if (error.code === 'PGRST116') {
        // Kein Benutzer gefunden
        return null;
      }
      console.error('Fehler beim Abrufen des Benutzerprofils:', error);
      throw error;
    }
    
    return data;
  },
  
  /**
   * Benutzerprofil erstellen oder aktualisieren
   */
  async createOrUpdateProfile(profile: Partial<UserProfile> & { username: string }): Promise<UserProfile> {
    // Prüfen, ob der Benutzer bereits existiert
    const existingUser = await this.getUserByUsername(profile.username);
    
    if (existingUser) {
      // Benutzer aktualisieren
      const { data, error } = await supabase
        .from('user_profiles')
        .update({
          ...profile,
          last_online: new Date().toISOString()
        })
        .eq('username', profile.username)
        .select()
        .single();
        
      if (error) {
        console.error('Fehler beim Aktualisieren des Benutzerprofils:', error);
        throw error;
      }
      
      return data;
    } else {
      // Neuen Benutzer erstellen
      const { data, error } = await supabase
        .from('user_profiles')
        .insert({
          ...profile,
          created_at: new Date().toISOString(),
          last_online: new Date().toISOString()
        })
        .select()
        .single();
        
      if (error) {
        console.error('Fehler beim Erstellen des Benutzerprofils:', error);
        throw error;
      }
      
      return data;
    }
  },
  
  /**
   * Letzte Online-Zeit aktualisieren
   */
  async updateLastOnline(username: string): Promise<void> {
    const { error } = await supabase
      .from('user_profiles')
      .update({ last_online: new Date().toISOString() })
      .eq('username', username);
      
    if (error) {
      console.error('Fehler beim Aktualisieren der letzten Online-Zeit:', error);
      throw error;
    }
  }
};
