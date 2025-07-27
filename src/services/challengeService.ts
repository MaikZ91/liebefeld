import { supabase } from '@/integrations/supabase/client';

// Challenge pool für zufällige Auswahl
const DAILY_CHALLENGES = [
  "Geh raus & sprich eine fremde Person an",
  "Frag jemanden nach einer Buchempfehlung", 
  "Komplimentiere heute 3 Menschen aufrichtig",
  "Starte ein Gespräch mit jemandem im Café",
  "Rufe einen alten Freund an, den du lange nicht gesprochen hast",
  "Frag jemanden nach seinem Lieblingshobby",
  "Teile deine Meinung in einer Gruppendiskussion mit",
  "Lade jemanden spontan auf einen Kaffee ein",
  "Hilf einem Fremden ohne Gegenleistung",
  "Erzähle jemandem von einem deiner Träume",
  "Frag jemanden nach seinem besten Reiseerlebnis",
  "Gib jemandem ehrliches Feedback",
  "Entschuldige dich bei jemandem, wenn nötig",
  "Teile ein persönliches Erlebnis mit neuen Leuten",
  "Frag jemanden, was ihn glücklich macht",
  "Organisiere ein spontanes Treffen mit Freunden",
  "Sprich über deine Ängste mit jemandem",
  "Biete deine Hilfe einem Nachbarn an",
  "Frag jemanden nach seinem größten Lernerlebnis",
  "Starte den Tag mit einem ehrlichen Gespräch"
];

export interface UserChallenge {
  id: string;
  user_id: string | null;
  username: string;
  date: string;
  challenge_text: string;
  completed: boolean;
  completed_at: string | null;
  created_at: string;
}

export interface UserLevel {
  id: string;
  user_id: string | null;
  username: string;
  current_ep: number;
  challenges_completed_this_level: number;
  total_challenges_completed: number;
  streak: number;
  last_completed_date: string | null;
  created_at: string;
  updated_at: string;
}

// Hole oder erstelle das heutige Challenge für einen User
export const getTodaysChallenge = async (username: string): Promise<UserChallenge | null> => {
  const today = new Date().toISOString().split('T')[0];
  
  // Prüfe ob bereits ein Challenge für heute existiert
  const { data: existingChallenge, error } = await supabase
    .from('user_challenges')
    .select('*')
    .eq('username', username)
    .eq('date', today)
    .single();

  if (existingChallenge) {
    return existingChallenge;
  }

  // Erstelle neues Challenge für heute
  const randomChallenge = DAILY_CHALLENGES[Math.floor(Math.random() * DAILY_CHALLENGES.length)];
  
  const { data: newChallenge, error: insertError } = await supabase
    .from('user_challenges')
    .insert({
      username,
      date: today,
      challenge_text: randomChallenge,
      completed: false
    })
    .select()
    .single();

  if (insertError) {
    console.error('Error creating challenge:', insertError);
    return null;
  }

  return newChallenge;
};

// Markiere Challenge als abgeschlossen
export const completeChallenge = async (challengeId: string, username: string): Promise<boolean> => {
  const { error: updateError } = await supabase
    .from('user_challenges')
    .update({
      completed: true,
      completed_at: new Date().toISOString()
    })
    .eq('id', challengeId)
    .eq('username', username);

  if (updateError) {
    console.error('Error completing challenge:', updateError);
    return false;
  }

  // Update user level/EP
  await updateUserLevel(username);
  return true;
};

// Hole User Level oder erstelle neues
export const getUserLevel = async (username: string): Promise<UserLevel | null> => {
  const { data: existingLevel, error } = await supabase
    .from('user_levels')
    .select('*')
    .eq('username', username)
    .single();

  if (existingLevel) {
    return existingLevel;
  }

  // Erstelle neues Level für User
  const { data: newLevel, error: insertError } = await supabase
    .from('user_levels')
    .insert({
      username,
      current_ep: 1,
      challenges_completed_this_level: 0,
      total_challenges_completed: 0,
      streak: 0
    })
    .select()
    .single();

  if (insertError) {
    console.error('Error creating user level:', insertError);
    return null;
  }

  return newLevel;
};

// Update User Level nach abgeschlossenem Challenge
const updateUserLevel = async (username: string): Promise<void> => {
  const level = await getUserLevel(username);
  if (!level) return;

  const today = new Date().toISOString().split('T')[0];
  const lastCompleted = level.last_completed_date;
  
  // Berechne Streak
  let newStreak = level.streak;
  if (lastCompleted) {
    const lastDate = new Date(lastCompleted);
    const todayDate = new Date(today);
    const diffDays = Math.floor((todayDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) {
      newStreak += 1; // Streak fortsetzung
    } else if (diffDays > 1) {
      newStreak = 1; // Streak neu starten
    }
  } else {
    newStreak = 1; // Erster Challenge
  }

  // Berechne neues Level
  const newCompletedThisLevel = level.challenges_completed_this_level + 1;
  const challengesNeededForLevel = Math.min(7, 3 + level.current_ep); // Steigender Schwierigkeitsgrad
  
  let newEP = level.current_ep;
  let completedThisLevel = newCompletedThisLevel;
  
  if (newCompletedThisLevel >= challengesNeededForLevel && level.current_ep < 20) {
    newEP += 1;
    completedThisLevel = 0;
  }

  const { error } = await supabase
    .from('user_levels')
    .update({
      current_ep: newEP,
      challenges_completed_this_level: completedThisLevel,
      total_challenges_completed: level.total_challenges_completed + 1,
      streak: newStreak,
      last_completed_date: today
    })
    .eq('username', username);

  if (error) {
    console.error('Error updating user level:', error);
  }
};

// Prüfe ob Coaching für User aktiviert ist
export const isCoachingEnabled = async (username: string): Promise<boolean> => {
  const { data, error } = await supabase
    .from('user_profiles')
    .select('coaching_enabled')
    .eq('username', username)
    .single();

  if (error || !data) {
    return false;
  }

  return data.coaching_enabled || false;
};

// Aktiviere/Deaktiviere Coaching
export const setCoachingEnabled = async (username: string, enabled: boolean): Promise<boolean> => {
  const { error } = await supabase
    .from('user_profiles')
    .update({ coaching_enabled: enabled })
    .eq('username', username);

  if (error) {
    console.error('Error updating coaching setting:', error);
    return false;
  }

  return true;
};