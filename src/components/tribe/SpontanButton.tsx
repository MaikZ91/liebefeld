import React, { useState, useEffect } from 'react';
import { Zap, X, MapPin, Clock, Send, ChevronRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { UserProfile } from '@/types/tribe';
import { motion, AnimatePresence } from 'framer-motion';

interface Props {
  userProfile: UserProfile;
  selectedCity: string;
}

const ACTIVITIES = [
  { emoji: '☕', label: 'Kaffee', color: 'text-amber-400' },
  { emoji: '🏃', label: 'Sport', color: 'text-green-400' },
  { emoji: '🍺', label: 'Ausgehen', color: 'text-yellow-400' },
  { emoji: '🎨', label: 'Kreativ', color: 'text-purple-400' },
  { emoji: '💬', label: 'Chillen', color: 'text-blue-400' },
  { emoji: '🍽️', label: 'Essen', color: 'text-orange-400' },
];

const TIME_OPTIONS = ['Jetzt', 'In 1h', 'In 2h', 'Heute Abend'];

const SPONTAN_STATUS_KEY = 'tribe_spontan_status';

interface SpontanStatus {
  active: boolean;
  expiresAt: string;
  activity: string;
}

export const SpontanButton: React.FC<Props> = ({ userProfile, selectedCity }) => {
  const [step, setStep] = useState<'idle' | 'activity' | 'details'>('idle');
  const [selectedActivity, setSelectedActivity] = useState<typeof ACTIVITIES[0] | null>(null);
  const [customText, setCustomText] = useState('');
  const [selectedTime, setSelectedTime] = useState('Jetzt');
  const [location, setLocation] = useState('');
  const [isPosting, setIsPosting] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const [activeLabel, setActiveLabel] = useState('');
  const [activeCount, setActiveCount] = useState(0);

  // Count currently active users
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

  // Check existing status
  useEffect(() => {
    const saved = localStorage.getItem(SPONTAN_STATUS_KEY);
    if (saved) {
      try {
        const status: SpontanStatus = JSON.parse(saved);
        const expiresAt = new Date(status.expiresAt);
        if (expiresAt > new Date()) {
          setIsActive(true);
          setActiveLabel(status.activity);
        } else {
          localStorage.removeItem(SPONTAN_STATUS_KEY);
          deactivateStatus();
        }
      } catch { localStorage.removeItem(SPONTAN_STATUS_KEY); }
    }
  }, []);

  const deactivateStatus = async () => {
    try {
      await supabase
        .from('user_profiles')
        .update({ current_status_message: null })
        .eq('username', userProfile.username);
    } catch (e) { console.error('Error clearing status:', e); }
  };

  const post = async () => {
    if (!selectedActivity) return;
    setIsPosting(true);

    try {
      const activityLabel = customText || `${selectedActivity.emoji} ${selectedActivity.label}`;
      const expiresAt = new Date(Date.now() + 3 * 60 * 60 * 1000); // 3h default

      // Update user status
      await supabase
        .from('user_profiles')
        .update({ current_status_message: `${selectedActivity.emoji} ${activityLabel}` })
        .eq('username', userProfile.username);

      // Build chat message
      const locationText = location ? ` 📍 ${location}` : '';
      const timeText = selectedTime !== 'Jetzt' ? ` ⏰ ${selectedTime}` : '';
      const chatText = `${selectedActivity.emoji} ${userProfile.username} sucht Leute für: **${activityLabel}**${timeText}${locationText}\n\nWer ist dabei? 👇`;

      await supabase.from('chat_messages').insert({
        group_id: 'tribe_community_board',
        sender: userProfile.username || 'Anonym',
        text: chatText,
        avatar: userProfile.avatarUrl || userProfile.avatar || null,
        meetup_responses: {
          'bin dabei': [{ username: userProfile.username, avatar: userProfile.avatarUrl || userProfile.avatar }],
          'diesmal nicht': [],
        },
      });

      // Save local status
      const status: SpontanStatus = { active: true, expiresAt: expiresAt.toISOString(), activity: activityLabel };
      localStorage.setItem(SPONTAN_STATUS_KEY, JSON.stringify(status));
      setIsActive(true);
      setActiveLabel(activityLabel);
      setStep('idle');
      setSelectedActivity(null);
      setCustomText('');
      setLocation('');
      setSelectedTime('Jetzt');
    } catch (error) {
      console.error('Error posting spontan:', error);
    } finally {
      setIsPosting(false);
    }
  };

  const deactivate = () => {
    setIsActive(false);
    localStorage.removeItem(SPONTAN_STATUS_KEY);
    deactivateStatus();
  };

  const reset = () => {
    setStep('idle');
    setSelectedActivity(null);
    setCustomText('');
    setLocation('');
    setSelectedTime('Jetzt');
  };

  // ACTIVE STATE
  if (isActive) {
    return (
      <motion.div
        initial={{ opacity: 0, y: -4 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl border border-yellow-500/20"
        style={{ background: 'linear-gradient(135deg, rgba(234,179,8,0.08), rgba(234,179,8,0.02))' }}
      >
        <div className="flex items-center gap-2 min-w-0">
          <span className="relative flex h-2 w-2 flex-shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-yellow-400" />
          </span>
          <span className="text-xs text-white/80 truncate">
            {activeLabel}
          </span>
        </div>
        <button onClick={deactivate} className="text-white/30 hover:text-white/60 flex-shrink-0 p-0.5">
          <X className="w-3.5 h-3.5" />
        </button>
      </motion.div>
    );
  }

  return (
    <div className="space-y-0">
      <AnimatePresence mode="wait">
        {step === 'idle' && (
          <motion.button
            key="idle"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => setStep('activity')}
            className="group w-full flex items-center gap-2.5 px-3 py-2 rounded-xl bg-zinc-800/50 border border-white/[0.06] hover:border-yellow-500/20 transition-all"
          >
            <Zap className="w-3.5 h-3.5 text-yellow-500 flex-shrink-0" />
            <span className="text-xs text-white/60 group-hover:text-white/80 transition-colors flex-1 text-left">
              Spontan was machen?
            </span>
            {activeCount > 0 && (
              <span className="text-[10px] text-yellow-500/50 flex-shrink-0">
                {activeCount} aktiv
              </span>
            )}
            <ChevronRight className="w-3 h-3 text-white/20 group-hover:text-white/40 flex-shrink-0" />
          </motion.button>
        )}

        {step === 'activity' && (
          <motion.div
            key="activity"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="rounded-xl bg-zinc-800/80 border border-white/10 p-3 space-y-2.5"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-white/70">Was hast du vor?</span>
              <button onClick={reset} className="p-0.5 text-white/30 hover:text-white/60">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-3 gap-1.5">
              {ACTIVITIES.map(a => (
                <button
                  key={a.label}
                  onClick={() => {
                    setSelectedActivity(a);
                    setStep('details');
                  }}
                  className="flex flex-col items-center gap-1 py-2 px-1 rounded-lg bg-zinc-700/30 hover:bg-zinc-700/60 border border-transparent hover:border-white/10 transition-all active:scale-95"
                >
                  <span className="text-lg">{a.emoji}</span>
                  <span className="text-[10px] text-white/60">{a.label}</span>
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {step === 'details' && selectedActivity && (
          <motion.div
            key="details"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="rounded-xl bg-zinc-800/80 border border-white/10 p-3 space-y-2.5"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="text-sm">{selectedActivity.emoji}</span>
                <span className="text-xs font-medium text-white/80">{selectedActivity.label}</span>
              </div>
              <button onClick={() => setStep('activity')} className="p-0.5 text-white/30 hover:text-white/60">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Optional custom text */}
            <input
              type="text"
              placeholder={`z.B. "${selectedActivity.label} im Park" (optional)`}
              value={customText}
              onChange={e => setCustomText(e.target.value)}
              className="w-full text-xs bg-zinc-700/40 border border-white/5 rounded-lg px-2.5 py-1.5 text-white/90 placeholder:text-white/25 focus:outline-none focus:border-yellow-500/30"
            />

            {/* Time chips */}
            <div className="flex gap-1.5 flex-wrap">
              {TIME_OPTIONS.map(t => (
                <button
                  key={t}
                  onClick={() => setSelectedTime(t)}
                  className={`px-2 py-1 rounded-full text-[10px] font-medium border transition-all ${
                    selectedTime === t
                      ? 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30'
                      : 'bg-zinc-700/30 text-white/40 border-transparent hover:text-white/60'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>

            {/* Optional location */}
            <div className="flex items-center gap-1.5 bg-zinc-700/30 rounded-lg px-2.5 py-1.5">
              <MapPin className="w-3 h-3 text-white/25 flex-shrink-0" />
              <input
                type="text"
                placeholder="Ort (optional)"
                value={location}
                onChange={e => setLocation(e.target.value)}
                className="flex-1 text-xs bg-transparent text-white/80 placeholder:text-white/25 focus:outline-none"
              />
            </div>

            {/* Post button */}
            <button
              onClick={post}
              disabled={isPosting}
              className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg bg-yellow-500 hover:bg-yellow-400 text-black text-xs font-bold uppercase tracking-wider transition-all active:scale-[0.98] disabled:opacity-50"
            >
              {isPosting ? (
                <span className="animate-pulse">Wird gepostet...</span>
              ) : (
                <>
                  <Send className="w-3 h-3" />
                  Vorschlag posten
                </>
              )}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
