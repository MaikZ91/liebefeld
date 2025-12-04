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
    <div className="bg-zinc-900/60 border border-white/5 rounded-lg p-4 mb-4">
      <div className="flex items-center gap-2 mb-3">
        <Sparkles size={14} className="text-gold" />
        <span className="text-xs font-medium text-gold uppercase tracking-wider">Willkommen in der Community!</span>
      </div>
      
      <p className="text-[11px] text-zinc-400 mb-3">
        Neue Mitglieder sind da – stellt euch gerne vor! 👋
      </p>
      
      <div className="flex flex-wrap gap-2">
        {recentMembers.map((member) => (
          <button
            key={member.id}
            onClick={() => onProfileClick?.(member.username)}
            className="flex items-center gap-2 bg-black/40 hover:bg-black/60 border border-white/10 hover:border-gold/30 rounded-full px-3 py-1.5 transition-all group"
          >
            <div className="w-5 h-5 rounded-full overflow-hidden bg-zinc-800 flex-shrink-0">
              {member.avatar ? (
                <img 
                  src={member.avatar} 
                  alt={member.username}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-[8px] text-zinc-500">
                  {member.username.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            <span className="text-[11px] text-zinc-300 group-hover:text-white transition-colors">
              {member.username}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};
