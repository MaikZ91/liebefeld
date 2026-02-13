import React, { useState, useEffect, useMemo } from 'react';
import { Zap, Clock, MapPin, Users, Check } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { motion } from 'framer-motion';
import { Post, UserProfile } from '@/types/tribe';

interface SpontanCardProps {
  post: Post;
  userProfile: UserProfile;
  onJoin: (postId: string) => void;
}

/** Parse "⚡ SPONTAN | 🍺 Ausgehen\n⏰ 18:00 – 20:00\n📍 Innenstadt" */
function parseSpontanPost(text: string) {
  const lines = text.split('\n');
  let activity = '';
  let startTime = '';
  let endTime = '';
  let location = '';

  for (const line of lines) {
    if (line.startsWith('⚡ SPONTAN |')) {
      activity = line.replace('⚡ SPONTAN |', '').trim();
    }
    if (line.includes('⏰')) {
      const timeMatch = line.match(/(\d{1,2}:\d{2})\s*[–-]\s*(\d{1,2}:\d{2})/);
      if (timeMatch) {
        startTime = timeMatch[1];
        endTime = timeMatch[2];
      }
    }
    if (line.includes('📍')) {
      location = line.replace('📍', '').trim();
    }
  }

  return { activity, startTime, endTime, location };
}

function timeToMinutes(t: string): number {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + (m || 0);
}

export const SpontanCard: React.FC<SpontanCardProps> = ({ post, userProfile, onJoin }) => {
  const parsed = useMemo(() => parseSpontanPost(post.text), [post.text]);
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(interval);
  }, []);

  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const startMin = timeToMinutes(parsed.startTime);
  const endMin = timeToMinutes(parsed.endTime);
  const totalDuration = endMin - startMin;
  const elapsed = Math.max(0, Math.min(currentMinutes - startMin, totalDuration));
  const progress = totalDuration > 0 ? (elapsed / totalDuration) * 100 : 0;
  const isLive = currentMinutes >= startMin && currentMinutes < endMin;
  const isExpired = currentMinutes >= endMin;
  const remaining = endMin - currentMinutes;
  const remainingH = Math.floor(remaining / 60);
  const remainingM = remaining % 60;

  const dabeiUsers = post.meetup_responses?.['bin dabei'] || [];
  const userJoined = dabeiUsers.some(u => u.username === userProfile?.username);

  const handleQuickJoin = async () => {
    onJoin(post.id);
  };

  if (isExpired) return null;

  const nowStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, rgba(234,179,8,0.06), rgba(0,0,0,0.4))',
        borderColor: isLive ? 'rgba(234,179,8,0.3)' : 'rgba(255,255,255,0.06)',
      }}
    >
      {/* Header */}
      <div className="px-3 pt-3 pb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-zinc-800 border border-white/10 overflow-hidden flex-shrink-0">
            {post.userAvatar ? (
              <img src={post.userAvatar} className="w-full h-full object-cover" alt="" />
            ) : (
              <span className="text-[10px] text-zinc-500 flex items-center justify-center h-full">{post.user[0]}</span>
            )}
          </div>
          <div>
            <span className="text-[10px] font-bold text-white uppercase tracking-wide">{post.user}</span>
            <div className="flex items-center gap-1">
              <Zap className="w-2.5 h-2.5 text-yellow-500" />
              <span className="text-[9px] text-yellow-500/80 font-medium">{parsed.activity}</span>
            </div>
          </div>
        </div>
        {isLive && (
          <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-yellow-500/15 border border-yellow-500/30">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-yellow-400" />
            </span>
            <span className="text-[8px] font-bold text-yellow-400 uppercase">Live</span>
          </div>
        )}
      </div>

      {/* Time display */}
      <div className="px-3 pb-2">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[10px] text-white/40 font-mono">{parsed.startTime}</span>
          <div className="flex items-center gap-1">
            <Clock className="w-2.5 h-2.5 text-white/30" />
            <span className="text-[10px] text-white/50 font-mono">
              {isLive ? nowStr : 'startet bald'}
            </span>
          </div>
          <span className="text-[10px] text-white/40 font-mono">{parsed.endTime}</span>
        </div>

        {/* Progress bar */}
        <div className="h-1.5 rounded-full bg-white/[0.06] overflow-hidden relative">
          <motion.div
            className="h-full rounded-full"
            style={{
              background: isLive
                ? 'linear-gradient(90deg, #eab308, #f59e0b)'
                : 'rgba(255,255,255,0.1)',
              width: `${Math.max(progress, 2)}%`,
            }}
            initial={{ width: 0 }}
            animate={{ width: `${Math.max(progress, 2)}%` }}
            transition={{ duration: 0.8 }}
          />
          {isLive && (
            <div
              className="absolute top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-yellow-400 border-2 border-black shadow-[0_0_8px_rgba(234,179,8,0.5)]"
              style={{ left: `calc(${progress}% - 5px)` }}
            />
          )}
        </div>

        {/* Remaining time */}
        {isLive && remaining > 0 && (
          <div className="mt-1 text-right">
            <span className="text-[9px] text-yellow-500/60">
              noch {remainingH > 0 ? `${remainingH}h ` : ''}{remainingM}min
            </span>
          </div>
        )}
      </div>

      {/* Location */}
      {parsed.location && (
        <div className="px-3 pb-2 flex items-center gap-1">
          <MapPin className="w-2.5 h-2.5 text-white/25" />
          <span className="text-[10px] text-white/50">{parsed.location}</span>
        </div>
      )}

      {/* Footer: Participants + Join */}
      <div className="px-3 pb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {dabeiUsers.length > 0 && (
            <div className="flex -space-x-1.5">
              {dabeiUsers.slice(0, 5).map((u, i) => (
                <div
                  key={i}
                  className="w-5 h-5 rounded-full border-2 border-black bg-zinc-800 overflow-hidden ring-1 ring-yellow-500/30"
                >
                  {u.avatar ? (
                    <img src={u.avatar} className="w-full h-full object-cover" alt="" />
                  ) : (
                    <span className="text-[7px] flex items-center justify-center h-full text-yellow-400 font-bold">
                      {u.username[0]}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
          <span className="text-[9px] text-white/40">
            {dabeiUsers.length} {dabeiUsers.length === 1 ? 'Person' : 'Leute'}
          </span>
        </div>

        <button
          onClick={handleQuickJoin}
          disabled={userJoined}
          className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all active:scale-95 ${
            userJoined
              ? 'bg-yellow-500/15 text-yellow-400 border border-yellow-500/30'
              : 'bg-yellow-500 text-black hover:bg-yellow-400'
          }`}
        >
          {userJoined ? (
            <>
              <Check className="w-3 h-3" />
              Dabei
            </>
          ) : (
            <>
              <Users className="w-3 h-3" />
              Bin dabei!
            </>
          )}
        </button>
      </div>
    </motion.div>
  );
};
