import React, { useState, useEffect } from 'react';
import { Zap, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { UserProfile } from '@/types/tribe';
import { motion, AnimatePresence } from 'framer-motion';

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
  const [activeCount, setActiveCount] = useState(0);

  // Count currently active users (with status message)
  useEffect(() => {
    const fetchActiveCount = async () => {
      const { count } = await supabase
        .from('user_profiles')
        .select('*', { count: 'exact', head: true })
        .not('current_status_message', 'is', null)
        .neq('username', userProfile.username || '');
      setActiveCount(count || 0);
    };
    fetchActiveCount();
    const interval = setInterval(fetchActiveCount, 60000);
    return () => clearInterval(interval);
  }, [userProfile.username]);

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

      await supabase
        .from('user_profiles')
        .update({ current_status_message: `🙋 Ich hab Zeit! (noch ${hours}h)` })
        .eq('username', userProfile.username);

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

      const userInterests = userProfile.interests || [];
      let bestEvent = events?.[0];
      if (events && userInterests.length > 0) {
        const matched = events.find(e => {
          const cat = (e.category || '').toLowerCase();
          return userInterests.some(i => cat.includes(i.toLowerCase()));
        });
        if (matched) bestEvent = matched;
      }

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

  const timeLabel = remainingMinutes < 60 ? `${remainingMinutes}min` : `${Math.ceil(remainingMinutes / 60)}h`;

  // ACTIVE STATE — compact glowing pill
  if (isActive) {
    return (
      <motion.button
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        onClick={deactivate}
        className="flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all active:scale-95"
        style={{
          background: 'linear-gradient(135deg, rgba(234,179,8,0.15), rgba(234,179,8,0.05))',
          borderColor: 'rgba(234,179,8,0.3)',
        }}
      >
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-yellow-400" />
        </span>
        <span className="text-xs font-medium text-yellow-400/90">
          Du bist live
        </span>
        <span className="text-[10px] text-white/40">
          {timeLabel}
        </span>
        <X className="w-3 h-3 text-white/30 ml-0.5" />
      </motion.button>
    );
  }

  // PICKER STATE — inline duration selection
  if (showPicker) {
    return (
      <motion.div
        initial={{ width: 140, opacity: 0 }}
        animate={{ width: 'auto', opacity: 1 }}
        className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-zinc-800/80 border border-white/10"
      >
        <span className="text-[10px] text-white/40 pl-1">Wie lang?</span>
        {DURATIONS.map(d => (
          <button
            key={d.value}
            onClick={() => activate(d.value)}
            disabled={isPosting}
            className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-yellow-500/10 text-yellow-400 hover:bg-yellow-500/20 border border-yellow-500/20 transition-all active:scale-90 disabled:opacity-50"
          >
            {d.label}
          </button>
        ))}
        <button onClick={() => setShowPicker(false)} className="p-0.5 text-white/30 hover:text-white/60">
          <X className="w-3 h-3" />
        </button>
      </motion.div>
    );
  }

  // DEFAULT STATE — compact pill with social proof
  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.97 }}
      onClick={() => setShowPicker(true)}
      disabled={isPosting}
      className="group flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-800/60 border border-white/[0.06] hover:border-yellow-500/20 transition-all"
    >
      <div className="relative">
        <Zap className="w-3.5 h-3.5 text-yellow-500 group-hover:text-yellow-400 transition-colors" />
        <div className="absolute inset-0 blur-sm bg-yellow-500/30 rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
      <span className="text-xs font-medium text-white/70 group-hover:text-white/90 transition-colors">
        Ich hab Zeit!
      </span>
      {activeCount > 0 && (
        <span className="text-[10px] text-yellow-500/60 border-l border-white/10 pl-2 ml-0.5">
          +{activeCount} online
        </span>
      )}
    </motion.button>
  );
};
