import React, { useState, useEffect, useCallback } from 'react';
import { Clock, Zap, X, Check } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { UserProfile } from '@/types/tribe';

interface Props {
  userProfile: UserProfile;
  selectedCity: string;
}

const DURATIONS = [
  { label: '1h', value: 1 },
  { label: '2h', value: 2 },
  { label: '3h', value: 3 },
  { label: '4h', value: 4 },
];

const SPONTAN_STATUS_KEY = 'tribe_spontan_status';

interface SpontanStatus {
  active: boolean;
  expiresAt: string;
  duration: number;
}

export const SpontanButton: React.FC<Props> = ({ userProfile, selectedCity }) => {
  const [isActive, setIsActive] = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  const [remainingMinutes, setRemainingMinutes] = useState(0);
  const [isPosting, setIsPosting] = useState(false);

  // Check for existing active status on mount
  useEffect(() => {
    const saved = localStorage.getItem(SPONTAN_STATUS_KEY);
    if (saved) {
      try {
        const status: SpontanStatus = JSON.parse(saved);
        const expiresAt = new Date(status.expiresAt);
        if (expiresAt > new Date()) {
          setIsActive(true);
          setRemainingMinutes(Math.ceil((expiresAt.getTime() - Date.now()) / 60000));
        } else {
          localStorage.removeItem(SPONTAN_STATUS_KEY);
          deactivateStatus();
        }
      } catch { localStorage.removeItem(SPONTAN_STATUS_KEY); }
    }
  }, []);

  // Countdown timer
  useEffect(() => {
    if (!isActive) return;
    const interval = setInterval(() => {
      const saved = localStorage.getItem(SPONTAN_STATUS_KEY);
      if (!saved) { setIsActive(false); return; }
      const status: SpontanStatus = JSON.parse(saved);
      const remaining = Math.ceil((new Date(status.expiresAt).getTime() - Date.now()) / 60000);
      if (remaining <= 0) {
        setIsActive(false);
        localStorage.removeItem(SPONTAN_STATUS_KEY);
        deactivateStatus();
      } else {
        setRemainingMinutes(remaining);
      }
    }, 30000);
    return () => clearInterval(interval);
  }, [isActive]);

  const deactivateStatus = async () => {
    try {
      await supabase
        .from('user_profiles')
        .update({ current_status_message: null })
        .eq('username', userProfile.username);
    } catch (e) { console.error('Error clearing status:', e); }
  };

  const activate = async (hours: number) => {
    setIsPosting(true);
    setShowPicker(false);
    
    try {
      const expiresAt = new Date(Date.now() + hours * 60 * 60 * 1000);
      
      // 1. Set user status
      await supabase
        .from('user_profiles')
        .update({ current_status_message: `🙋 Ich hab Zeit! (noch ${hours}h)` })
        .eq('username', userProfile.username);

      // 2. Find a matching event for today
      const today = new Date().toISOString().split('T')[0];
      const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      
      let eventQuery = supabase
        .from('community_events')
        .select('id, title, category, date, time, location')
        .gte('date', today)
        .lte('date', tomorrow)
        .order('likes', { ascending: false })
        .limit(10);

      if (selectedCity && selectedCity !== 'All' && selectedCity !== 'Deutschland') {
        eventQuery = eventQuery.ilike('city', selectedCity);
      }

      const { data: events } = await eventQuery;

      // Match event to user interests
      const userInterests = userProfile.interests || [];
      let bestEvent = events?.[0];
      if (events && userInterests.length > 0) {
        const matched = events.find(e => {
          const cat = (e.category || '').toLowerCase();
          return userInterests.some(i => cat.includes(i.toLowerCase()));
        });
        if (matched) bestEvent = matched;
      }

      // 3. Post to community chat
      const eventText = bestEvent
        ? `Passend dazu: „${bestEvent.title}" ${bestEvent.time ? `um ${bestEvent.time}` : ''} ${bestEvent.location ? `in ${bestEvent.location}` : ''} 🎯`
        : `Wer hat Lust auf was in ${selectedCity}? 🎯`;

      const chatText = `🙋 ${userProfile.username} hat gerade Zeit (${hours}h)! ${eventText}\n\nWer ist dabei? 👇`;

      await supabase.from('chat_messages').insert({
        group_id: 'bi_ausgehen',
        sender: 'MIA',
        text: chatText,
        avatar: '/lovable-uploads/e819d6a5-7715-4cb0-8f30-952438637b87.png',
        event_id: bestEvent?.id || null,
        event_title: bestEvent?.title || null,
        event_date: bestEvent?.date || null,
        event_location: bestEvent?.location || null,
        meetup_responses: { 'bin dabei': [{ username: userProfile.username, avatar: userProfile.avatarUrl || userProfile.avatar }], 'diesmal nicht': [] },
      });

      // 4. Save local status
      const status: SpontanStatus = { active: true, expiresAt: expiresAt.toISOString(), duration: hours };
      localStorage.setItem(SPONTAN_STATUS_KEY, JSON.stringify(status));
      setIsActive(true);
      setRemainingMinutes(hours * 60);
    } catch (error) {
      console.error('Error activating spontan:', error);
    } finally {
      setIsPosting(false);
    }
  };

  const deactivate = () => {
    setIsActive(false);
    localStorage.removeItem(SPONTAN_STATUS_KEY);
    deactivateStatus();
  };

  if (isActive) {
    return (
      <button
        onClick={deactivate}
        className="w-full flex items-center justify-between gap-2 px-4 py-2.5 rounded-xl bg-primary/15 border border-primary/30 transition-all active:scale-[0.98]"
      >
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
          <span className="text-sm font-medium text-primary">
            Du bist verfügbar
          </span>
          <span className="text-xs text-muted-foreground">
            noch {remainingMinutes < 60 ? `${remainingMinutes}min` : `${Math.ceil(remainingMinutes / 60)}h`}
          </span>
        </div>
        <X className="w-4 h-4 text-muted-foreground" />
      </button>
    );
  }

  return (
    <div className="relative">
      {!showPicker ? (
        <button
          onClick={() => setShowPicker(true)}
          disabled={isPosting}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-surface border border-white/10 hover:border-primary/30 hover:bg-primary/5 transition-all active:scale-[0.98]"
        >
          <Zap className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium text-foreground">
            Ich hab Zeit!
          </span>
        </button>
      ) : (
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-surface border border-primary/30 animate-in fade-in slide-in-from-top-2 duration-200">
          <span className="text-xs text-muted-foreground whitespace-nowrap">Wie lang?</span>
          <div className="flex gap-1.5 flex-1">
            {DURATIONS.map(d => (
              <button
                key={d.value}
                onClick={() => activate(d.value)}
                disabled={isPosting}
                className="flex-1 py-1.5 rounded-lg text-xs font-medium bg-primary/10 text-primary hover:bg-primary/20 border border-primary/20 transition-all active:scale-95"
              >
                {d.label}
              </button>
            ))}
          </div>
          <button onClick={() => setShowPicker(false)} className="p-1 text-muted-foreground hover:text-foreground">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
};
