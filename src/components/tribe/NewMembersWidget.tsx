import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Users } from 'lucide-react';

interface RecentMember {
  id: string;
  username: string;
  avatar: string | null;
  created_at: string;
}

export const NewMembersWidget: React.FC = () => {
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
    <div className="flex items-center gap-2 px-3 py-1.5 bg-zinc-900/50 rounded-full border border-white/5">
      <Users size={10} className="text-gold/60" />
      <div className="flex -space-x-2">
        {recentMembers.slice(0, 5).map((member) => (
          <div
            key={member.id}
            className="w-5 h-5 rounded-full border border-black overflow-hidden bg-zinc-800"
            title={member.username}
          >
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
        ))}
      </div>
      <span className="text-[9px] text-zinc-500">neu dabei</span>
    </div>
  );
};
