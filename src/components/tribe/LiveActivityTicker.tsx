import React, { useState, useEffect, useRef } from 'react';
import { Heart, Eye, Users, MessageCircle, Zap, Sparkles } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { motion, AnimatePresence } from 'framer-motion';

interface ActivityItem {
  id: string;
  username: string;
  avatar?: string | null;
  action: 'liked' | 'rsvp' | 'posted' | 'joined' | 'viewed';
  target?: string;
  timestamp: string;
}

const ACTION_CONFIG: Record<ActivityItem['action'], { icon: React.ElementType; verb: string; color: string }> = {
  liked: { icon: Heart, verb: 'hat geliked', color: 'text-red-400' },
  rsvp: { icon: Users, verb: 'ist dabei bei', color: 'text-green-400' },
  posted: { icon: MessageCircle, verb: 'hat gepostet', color: 'text-blue-400' },
  joined: { icon: Zap, verb: 'ist neu dabei', color: 'text-yellow-400' },
  viewed: { icon: Eye, verb: 'schaut sich an:', color: 'text-white/50' },
};

export const LiveActivityTicker: React.FC = () => {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [visibleIndex, setVisibleIndex] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    fetchRecentActivity();
    const refreshInterval = setInterval(fetchRecentActivity, 60000);
    return () => clearInterval(refreshInterval);
  }, []);

  // Rotate through activities
  useEffect(() => {
    if (activities.length <= 1) return;
    intervalRef.current = setInterval(() => {
      setVisibleIndex(prev => (prev + 1) % activities.length);
    }, 4000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [activities.length]);

  const fetchRecentActivity = async () => {
    const items: ActivityItem[] = [];
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    try {
      // 1. Recent likes on events (from activity logs with "like" interactions)
      const { data: likeLogs } = await supabase
        .from('user_activity_logs')
        .select('username, event_target, event_data, created_at')
        .gte('created_at', twoHoursAgo)
        .or('event_target.ilike.%like%,event_target.ilike.%herz%,event_target.ilike.%heart%,event_target.ilike.%❤%')
        .eq('event_type', 'click')
        .order('created_at', { ascending: false })
        .limit(10);

      (likeLogs || []).forEach(log => {
        if (log.username.startsWith('Guest_')) return;
        items.push({
          id: `like-${log.created_at}-${log.username}`,
          username: log.username,
          action: 'liked',
          target: 'ein Event',
          timestamp: log.created_at,
        });
      });

      // 2. Recent RSVPs / "Bin dabei" from community_events
      const { data: rsvpEvents } = await supabase
        .from('community_events')
        .select('id, title, liked_by_users')
        .gte('date', todayStart.toISOString().split('T')[0])
        .not('liked_by_users', 'eq', '[]')
        .limit(10);

      (rsvpEvents || []).forEach(evt => {
        const users = evt.liked_by_users as string[] | null;
        if (!Array.isArray(users)) return;
        users.slice(-3).forEach(u => {
          if (typeof u === 'string' && !u.startsWith('Guest_')) {
            items.push({
              id: `rsvp-${evt.id}-${u}`,
              username: u,
              action: 'rsvp',
              target: evt.title?.slice(0, 30) || 'einem Event',
              timestamp: new Date().toISOString(),
            });
          }
        });
      });

      // 3. Recent posts in community board
      const { data: recentPosts } = await supabase
        .from('chat_messages')
        .select('sender, avatar, created_at, text')
        .eq('group_id', 'tribe_community_board')
        .is('parent_id', null)
        .gte('created_at', twoHoursAgo)
        .order('created_at', { ascending: false })
        .limit(5);

      (recentPosts || []).forEach(p => {
        if (p.sender.startsWith('Guest_') || p.sender === 'MIA') return;
        const preview = p.text?.replace(/#\w+/g, '').trim().slice(0, 25);
        items.push({
          id: `post-${p.created_at}-${p.sender}`,
          username: p.sender,
          avatar: p.avatar,
          action: 'posted',
          target: preview ? `"${preview}…"` : undefined,
          timestamp: p.created_at,
        });
      });

      // 4. New members today
      const { data: newMembers } = await supabase
        .from('user_profiles')
        .select('username, avatar, created_at')
        .gte('created_at', todayStart.toISOString())
        .order('created_at', { ascending: false })
        .limit(3);

      (newMembers || []).forEach(m => {
        if (m.username.startsWith('Guest_')) return;
        items.push({
          id: `join-${m.username}`,
          username: m.username,
          avatar: m.avatar,
          action: 'joined',
          timestamp: m.created_at || new Date().toISOString(),
        });
      });

      // 5. Recent page views on event pages
      const { data: viewLogs } = await supabase
        .from('user_activity_logs')
        .select('username, event_target, event_data, created_at')
        .gte('created_at', twoHoursAgo)
        .eq('event_type', 'click')
        .or('event_target.ilike.%event%,event_target.ilike.%details%,event_target.ilike.%anschauen%')
        .order('created_at', { ascending: false })
        .limit(8);

      (viewLogs || []).forEach(log => {
        if (log.username.startsWith('Guest_')) return;
        items.push({
          id: `view-${log.created_at}-${log.username}`,
          username: log.username,
          action: 'viewed',
          target: 'Events',
          timestamp: log.created_at,
        });
      });

      // Resolve avatars for items missing them
      const usernamesNeedingAvatars = [...new Set(items.filter(i => !i.avatar).map(i => i.username))];
      if (usernamesNeedingAvatars.length > 0) {
        const { data: profiles } = await supabase
          .from('user_profiles')
          .select('username, avatar')
          .in('username', usernamesNeedingAvatars);
        const avatarMap = new Map((profiles || []).map(p => [p.username, p.avatar]));
        items.forEach(item => {
          if (!item.avatar) item.avatar = avatarMap.get(item.username) || null;
        });
      }

      // Deduplicate by username+action, keep most recent
      const seen = new Set<string>();
      const deduped = items
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .filter(item => {
          const key = `${item.username}-${item.action}`;
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        })
        .slice(0, 15);

      setActivities(deduped);
    } catch (err) {
      console.error('Error fetching activity ticker:', err);
    }
  };

  if (activities.length === 0) return null;

  const current = activities[visibleIndex];
  if (!current) return null;
  const config = ACTION_CONFIG[current.action];
  const Icon = config.icon;

  return (
    <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2 overflow-hidden">
      <div className="flex items-center gap-1.5 mb-1.5">
        <Sparkles className="w-3 h-3 text-yellow-500" />
        <span className="text-[9px] font-bold text-white/40 uppercase tracking-widest">Live in der Tribe</span>
        <span className="relative flex h-1.5 w-1.5 ml-auto">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-400" />
        </span>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={current.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3 }}
          className="flex items-center gap-2"
        >
          {/* Avatar */}
          <div className="w-6 h-6 rounded-full bg-zinc-800 border border-white/10 overflow-hidden flex-shrink-0">
            {current.avatar ? (
              <img src={current.avatar} className="w-full h-full object-cover" alt="" />
            ) : (
              <span className="text-[9px] text-zinc-400 flex items-center justify-center h-full font-bold">
                {current.username[0]?.toUpperCase()}
              </span>
            )}
          </div>

          {/* Action text */}
          <div className="flex items-center gap-1 min-w-0 flex-1">
            <span className="text-[11px] font-semibold text-white truncate max-w-[80px]">
              {current.username}
            </span>
            <Icon className={`w-3 h-3 flex-shrink-0 ${config.color}`} />
            <span className="text-[10px] text-white/50 truncate">
              {config.verb}
              {current.target && (
                <span className="text-white/70 ml-1">{current.target}</span>
              )}
            </span>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Dots indicator */}
      {activities.length > 1 && (
        <div className="flex justify-center gap-0.5 mt-1.5">
          {activities.slice(0, Math.min(activities.length, 8)).map((_, i) => (
            <div
              key={i}
              className={`h-0.5 rounded-full transition-all duration-300 ${
                i === visibleIndex % Math.min(activities.length, 8)
                  ? 'w-3 bg-yellow-500/60'
                  : 'w-1 bg-white/10'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
};
