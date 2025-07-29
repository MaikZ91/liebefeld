import { supabase } from '@/integrations/supabase/client';

// 12-Wochenprogramm MIA Challenges mit Tipps
const WEEKLY_CHALLENGES = [
  // Woche 1 – Selbstwahrnehmung & Achtsamkeit
  {
    week: 1,
    theme: "Selbstwahrnehmung & Achtsamkeit",
    challenges: [
      { text: "Geh 15 Minuten ohne Handy spazieren", tip: "Lass deine Augen wandern." },
      { text: "Nimm 3 Geräusche bewusst wahr, die du sonst übersiehst", tip: "Präsenz beginnt mit Zuhören." },
      { text: "Mach 3 ehrliche innere Komplimente über andere", tip: "Trainiere deinen Fokus." },
      { text: "Beobachte bewusst dein Umfeld für 10 Minuten ohne Ablenkung", tip: "Werde zum Beobachter." },
      { text: "Schreib 3 Dinge auf, die du heute gut gemacht hast", tip: "Selbstwert beginnt innen." },
      { text: "Setz dich allein in ein Café und bleib präsent", tip: "Alleinsein = nicht einsam." },
      { text: "Mach jemandem ein inneres Kompliment und halte Augenkontakt", tip: "Verbindungen beginnen innen." }
    ]
  },
  // Woche 2 – Kontaktaufnahme & Mut
  {
    week: 2,
    theme: "Kontaktaufnahme & Mut",
    challenges: [
      { text: "Sag 3 fremden Menschen 'Hi'", tip: "Ein Lächeln öffnet Türen." },
      { text: "Halte mit 3 Menschen kurz Augenkontakt", tip: "Zeig dich im Blick." },
      { text: "Frag jemanden nach dem Weg – auch wenn du ihn kennst", tip: "Übe das erste Wort." },
      { text: "Frag jemanden, wie sein Tag war", tip: "Interesse weckt Nähe." },
      { text: "Gib jemandem ein echtes Kompliment", tip: "Ehrlich. Direkt. Echt." },
      { text: "Bitte jemanden um Hilfe bei etwas Kleinem", tip: "Es verbindet." },
      { text: "Frag jemanden nach einem Café-Tipp", tip: "Ein Türöffner mit Leichtigkeit." }
    ]
  }
];

// Hilfsfunktion: Berechne Tag im Programm (1-84 für 12 Wochen)
const getDayInProgram = (startDate: Date): number => {
  const today = new Date();
  const diffTime = today.getTime() - startDate.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;
  return Math.max(1, Math.min(84, diffDays));
};

// Hilfsfunktion: Hole Challenge für bestimmten Tag
const getChallengeForDay = (day: number): { challenge: string; tip: string; week: number; theme: string } => {
  const weekIndex = Math.floor((day - 1) / 7);
  const dayInWeek = ((day - 1) % 7);
  
  if (weekIndex < WEEKLY_CHALLENGES.length) {
    const weekData = WEEKLY_CHALLENGES[weekIndex];
    const challengeData = weekData.challenges[dayInWeek];
    return {
      challenge: challengeData.text,
      tip: challengeData.tip,
      week: weekData.week,
      theme: weekData.theme
    };
  }
  
  // Fallback für Wochen die noch nicht definiert sind
  return {
    challenge: "Heute ist ein guter Tag, um mutig zu sein",
    tip: "Jeder kleine Schritt zählt.",
    week: weekIndex + 1,
    theme: "Persönliches Wachstum"
  };
};

export interface UserChallenge {
  id: string;
  user_id: string | null;
  username: string;
  date: string;
  challenge_text: string;
  mia_tip: string;
  week_number: number;
  week_theme: string;
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
    // Abwärtskompatibilität: fehlende Felder mit Standardwerten füllen
    return {
      ...existingChallenge,
      mia_tip: existingChallenge.mia_tip || "Jeder kleine Schritt zählt.",
      week_number: existingChallenge.week_number || 1,
      week_theme: existingChallenge.week_theme || "Persönliches Wachstum"
    };
  }

  // Hole User Level für Programm-Start
  const userLevel = await getUserLevel(username);
  const startDate = userLevel?.created_at ? new Date(userLevel.created_at) : new Date();
  
  // Berechne Tag im 12-Wochenprogramm
  const dayInProgram = getDayInProgram(startDate);
  const challengeData = getChallengeForDay(dayInProgram);
  
  const { data: newChallenge, error: insertError } = await supabase
    .from('user_challenges')
    .insert({
      username,
      date: today,
      challenge_text: challengeData.challenge,
      mia_tip: challengeData.tip,
      week_number: challengeData.week,
      week_theme: challengeData.theme,
      completed: false
    })
    .select()
    .single();

  if (insertError) {
    console.error('Error creating challenge:', insertError);
    return null;
  }

  // Sicherstellen dass alle Felder vorhanden sind
  return {
    ...newChallenge,
    mia_tip: newChallenge.mia_tip || challengeData.tip,
    week_number: newChallenge.week_number || challengeData.week,
    week_theme: newChallenge.week_theme || challengeData.theme
  };
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