import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Sparkles } from 'lucide-react';

interface RecentMember {
  id: string;
  username: string;
  avatar: string | null;
  created_at: string;
}

interface NewMembersWidgetProps {
  onProfileClick?: (username: string) => void;
}

export const NewMembersWidget: React.FC<NewMembersWidgetProps> = ({ onProfileClick }) => {
  const [recentMembers, setRecentMembers] = useState<RecentMember[]>([]);

  useEffect(() => {
    loadRecentMembers();
    
    // Subscribe to new members
    const channel = supabase
      .channel('new-members')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'user_profiles'
        },
        (payload) => {
          const newMember = payload.new as RecentMember;
          setRecentMembers(prev => [newMember, ...prev].slice(0, 5));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const loadRecentMembers = async () => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('id, username, avatar, created_at')
        .not('username', 'like', 'Guest_%')
        .order('created_at', { ascending: false })
        .limit(5);

      if (!error && data) {
        setRecentMembers(data);
      }
    } catch (error) {
      console.error('Error loading recent members:', error);
    }
  };

  if (recentMembers.length === 0) return null;

  return (
    <div className="bg-zinc-900/40 border border-white/5 rounded-lg px-3 py-2 mb-3">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <Sparkles size={10} className="text-gold" />
          <span className="text-[9px] text-zinc-400">Neu dabei:</span>
        </div>
        
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          {recentMembers.map((member) => (
            <button
              key={member.id}
              onClick={() => onProfileClick?.(member.username)}
              className="flex items-center gap-1.5 bg-black/30 hover:bg-black/50 border border-white/5 hover:border-gold/20 rounded-full px-2 py-1 transition-all group flex-shrink-0"
            >
              <div className="w-4 h-4 rounded-full overflow-hidden bg-zinc-800">
                {member.avatar ? (
                  <img src={member.avatar} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-[7px] text-zinc-500">
                    {member.username.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <span className="text-[9px] text-zinc-400 group-hover:text-white">{member.username}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
