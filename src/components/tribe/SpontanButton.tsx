import React, { useState, useEffect } from 'react';
import { Zap, X, MapPin, Send, ChevronRight, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { UserProfile } from '@/types/tribe';
import { UserProfile as ChatUserProfile } from '@/types/chatTypes';
import { motion, AnimatePresence } from 'framer-motion';
import { Slider } from '@/components/ui/slider';
import UserProfileDialog from '@/components/users/UserProfileDialog';
import { userService } from '@/services/userService';

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

const SPONTAN_STATUS_KEY = 'tribe_spontan_status';

interface SpontanStatus {
  active: boolean;
  expiresAt: string;
  activity: string;
  startHour: number;
  endHour: number;
}

function formatHour(h: number): string {
  const hour = Math.floor(h);
  const min = Math.round((h - hour) * 60);
  return `${hour.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`;
}

function getCurrentHour(): number {
  const now = new Date();
  return now.getHours() + now.getMinutes() / 60;
}

export const SpontanButton: React.FC<Props> = ({ userProfile, selectedCity }) => {
  const [step, setStep] = useState<'idle' | 'activity' | 'details'>('idle');
  const [selectedActivity, setSelectedActivity] = useState<typeof ACTIVITIES[0] | null>(null);
  const [customText, setCustomText] = useState('');
  const [location, setLocation] = useState('');
  const [isPosting, setIsPosting] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const [activeLabel, setActiveLabel] = useState('');
  const [activeCount, setActiveCount] = useState(0);
  const [selectedUserProfile, setSelectedUserProfile] = useState<ChatUserProfile | null>(null);
  const [showUserProfileDialog, setShowUserProfileDialog] = useState(false);
  const [loadingUserProfile, setLoadingUserProfile] = useState(false);

  const handleAvatarClick = async (username: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setLoadingUserProfile(true);
    setShowUserProfileDialog(true);
    try {
      const profile = await userService.getUserByUsername(username);
      setSelectedUserProfile(profile);
    } catch (error) {
      console.error('Error fetching user profile:', error);
      setShowUserProfileDialog(false);
    } finally {
      setLoadingUserProfile(false);
    }
  };

  // Time range slider state (hours as decimals, e.g. 18.5 = 18:30)
  const currentH = Math.ceil(getCurrentHour() * 2) / 2; // round to nearest 30min
  const [timeRange, setTimeRange] = useState<number[]>([
    Math.min(currentH, 23),
    Math.min(currentH + 2, 24),
  ]);

  // Today's active users
  const [activeUsers, setActiveUsers] = useState<Array<{ username: string; avatar: string | null }>>([]);
  
  useEffect(() => {
    const fetchActiveUsers = async () => {
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      
      // Get distinct usernames from activity logs today (accumulated, not just "currently online")
      const { data: logData } = await supabase
        .from('user_activity_logs')
        .select('username')
        .gte('created_at', todayStart.toISOString());
      
      const uniqueUsernames = [...new Set((logData || []).map(l => l.username))]
        .filter(u => !u.startsWith('Guest_'));
      
      if (uniqueUsernames.length > 0) {
        // Fetch profiles for these users
        const { data: profiles } = await supabase
          .from('user_profiles')
          .select('username, avatar')
          .in('username', uniqueUsernames);
        
        const real = (profiles || []).filter(u => !u.username.startsWith('Guest_'));
        // Sort users with real (uploaded) avatar first
        real.sort((a, b) => {
          const aReal = a.avatar && !a.avatar.includes('unsplash.com');
          const bReal = b.avatar && !b.avatar.includes('unsplash.com');
          if (aReal && !bReal) return -1;
          if (!aReal && bReal) return 1;
          return 0;
        });
        setActiveUsers(real);
        setActiveCount(real.length);
      } else {
        setActiveUsers([]);
        setActiveCount(0);
      }
    };
    fetchActiveUsers();
    const interval = setInterval(fetchActiveUsers, 60000);
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
      const startStr = formatHour(timeRange[0]);
      const endStr = formatHour(timeRange[1]);
      
      // Calculate expiry based on end time
      const now = new Date();
      const endDate = new Date(now);
      const endHour = Math.floor(timeRange[1]);
      const endMin = Math.round((timeRange[1] - endHour) * 60);
      endDate.setHours(endHour, endMin, 0, 0);
      if (endDate <= now) endDate.setDate(endDate.getDate() + 1);

      // Update user status
      await supabase
        .from('user_profiles')
        .update({ current_status_message: `${selectedActivity.emoji} ${activityLabel} ${startStr}-${endStr}` })
        .eq('username', userProfile.username);

      // Build chat message with structured data for the SpontanCard
      const locationText = location ? `\n📍 ${location}` : '';
      const chatText = `⚡ SPONTAN | ${selectedActivity.emoji} ${activityLabel}\n⏰ ${startStr} – ${endStr}${locationText}`;

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
      const status: SpontanStatus = {
        active: true,
        expiresAt: endDate.toISOString(),
        activity: activityLabel,
        startHour: timeRange[0],
        endHour: timeRange[1],
      };
      localStorage.setItem(SPONTAN_STATUS_KEY, JSON.stringify(status));
      setIsActive(true);
      setActiveLabel(activityLabel);
      setStep('idle');
      setSelectedActivity(null);
      setCustomText('');
      setLocation('');
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
    const h = Math.ceil(getCurrentHour() * 2) / 2;
    setTimeRange([Math.min(h, 23), Math.min(h + 2, 24)]);
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
          <motion.div
            key="idle"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="rounded-lg bg-zinc-800/60 border border-white/[0.06] overflow-hidden"
          >
            {/* Header bar – tappable */}
            <button
              onClick={() => setStep('activity')}
              className="group w-full flex items-center justify-between gap-2 px-3 py-2 hover:bg-zinc-700/30 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Zap className="w-3.5 h-3.5 text-yellow-500" />
                <span className="text-[11px] font-semibold uppercase tracking-wider text-white/70 group-hover:text-white/90 transition-colors">
                  Spontan was machen?
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                {activeCount > 0 && (
                  <span className="flex items-center gap-1 text-[10px] text-green-400/80">
                    <span className="relative flex h-1.5 w-1.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-400" />
                    </span>
                    {activeCount} aktiv
                  </span>
                )}
                <ChevronRight className="w-3.5 h-3.5 text-white/20 group-hover:text-white/40" />
              </div>
            </button>

            {/* Active users – horizontal row */}
            {activeUsers.length > 0 && (
              <div className="px-2 pb-2 flex gap-1.5 overflow-x-auto scrollbar-hide">
                {activeUsers.map(u => (
                  <div key={u.username} className="flex flex-col items-center gap-0.5 flex-shrink-0 w-10">
                    {u.avatar ? (
                      <img src={u.avatar} className="w-9 h-9 rounded-sm object-cover" alt="" />
                    ) : (
                      <div className="w-9 h-9 rounded-sm bg-zinc-600 flex items-center justify-center text-[10px] text-white/50 font-bold">
                        {u.username[0]?.toUpperCase()}
                      </div>
                    )}
                    <span className="text-[9px] text-white/50 truncate w-full text-center">{u.username}</span>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {step === 'activity' && (
          <motion.div
            key="activity"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="rounded-lg bg-zinc-800/80 border border-white/10 overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-3 py-2 border-b border-white/[0.06]">
              <span className="text-xs font-semibold uppercase tracking-wider text-white/70">Was hast du vor?</span>
              <button onClick={reset} className="p-0.5 text-white/30 hover:text-white/60">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Activity grid */}
            <div className="grid grid-cols-3 gap-1.5 p-2.5">
              {ACTIVITIES.map(a => (
                <button
                  key={a.label}
                  onClick={() => {
                    setSelectedActivity(a);
                    setStep('details');
                  }}
                  className="flex flex-col items-center gap-1 py-2.5 px-1 rounded-md bg-zinc-700/30 hover:bg-zinc-700/60 border border-transparent hover:border-white/10 transition-all active:scale-95"
                >
                  <span className="text-lg">{a.emoji}</span>
                  <span className="text-[10px] text-white/60">{a.label}</span>
                </button>
              ))}
            </div>

            {/* Active users grid */}
            {activeUsers.length > 0 && (
              <div className="px-2.5 pb-2.5 border-t border-white/[0.06] pt-2">
                <div className="flex items-center gap-1.5 mb-2">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-400" />
                  </span>
                  <span className="text-[9px] text-white/40 uppercase tracking-wider font-medium">
                    {activeCount} heute aktiv
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-1.5">
                  {activeUsers.map(u => (
                    <div
                      key={u.username}
                      className="flex items-center gap-2 px-2 py-1.5 rounded-md bg-zinc-700/30 border border-white/[0.04]"
                    >
                      {u.avatar ? (
                        <img src={u.avatar} className="w-7 h-7 rounded-sm object-cover flex-shrink-0" alt="" />
                      ) : (
                        <div className="w-7 h-7 rounded-sm bg-zinc-600 flex items-center justify-center text-[10px] text-white/50 font-bold flex-shrink-0">
                          {u.username[0]?.toUpperCase()}
                        </div>
                      )}
                      <span className="text-[11px] text-white/70 truncate">{u.username}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}

        {step === 'details' && selectedActivity && (
          <motion.div
            key="details"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="rounded-xl bg-zinc-800/80 border border-white/10 p-3 space-y-3"
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

            {/* Time range slider */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3 h-3 text-yellow-500/60" />
                  <span className="text-[10px] text-white/50">Zeitraum</span>
                </div>
                <span className="text-xs font-mono text-yellow-400">
                  {formatHour(timeRange[0])} – {formatHour(timeRange[1])}
                </span>
              </div>
              <Slider
                min={6}
                max={24}
                step={0.5}
                value={timeRange}
                onValueChange={setTimeRange}
                className="w-full"
              />
              <div className="flex justify-between text-[8px] text-white/20 px-0.5">
                <span>06:00</span>
                <span>12:00</span>
                <span>18:00</span>
                <span>24:00</span>
              </div>
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
