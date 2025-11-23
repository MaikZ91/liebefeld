import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface UnreadMessageState {
  [category: string]: boolean;
}

export const useUnreadMessages = (groupId: string, username: string) => {
  const [unreadByCategory, setUnreadByCategory] = useState<UnreadMessageState>({
    ausgehen: false,
    kreativität: false,
    sport: false
  });
  const [lastSeenTimestamp, setLastSeenTimestamp] = useState<Record<string, string>>({});

  // Load last seen timestamps from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(`last_seen_${groupId}`);
    if (stored) {
      setLastSeenTimestamp(JSON.parse(stored));
    }
  }, [groupId]);

  // Mark category as read
  const markCategoryAsRead = (category: string) => {
    const now = new Date().toISOString();
    const newTimestamps = { ...lastSeenTimestamp, [category]: now };
    setLastSeenTimestamp(newTimestamps);
    localStorage.setItem(`last_seen_${groupId}`, JSON.stringify(newTimestamps));
    
    setUnreadByCategory(prev => ({
      ...prev,
      [category]: false
    }));
  };

  // Check for new messages
  useEffect(() => {
    const checkUnreadMessages = async () => {
      const categories = ['ausgehen', 'kreativität', 'sport'];
      const newUnreadState: UnreadMessageState = {};

      // Get city abbreviation from groupId (e.g., "bi_ausgehen" -> "bi")
      const cityAbbr = groupId.split('_')[0];

      for (const category of categories) {
        const lastSeen = lastSeenTimestamp[category];
        const categoryGroupId = `${cityAbbr}_${category}`;
        
        if (!lastSeen) {
          // If no timestamp, check if there are any messages
          const { data, error } = await supabase
            .from('chat_messages')
            .select('id')
            .eq('group_id', categoryGroupId)
            .limit(1);
          
          newUnreadState[category] = !error && data && data.length > 0;
        } else {
          // Check for messages newer than last seen
          const { data, error } = await supabase
            .from('chat_messages')
            .select('id')
            .eq('group_id', categoryGroupId)
            .gt('created_at', lastSeen)
            .limit(1);
          
          newUnreadState[category] = !error && data && data.length > 0;
        }
      }

      setUnreadByCategory(newUnreadState);
    };

    checkUnreadMessages();
  }, [groupId, lastSeenTimestamp]);

  // Subscribe to new messages
  useEffect(() => {
    const channel = supabase
      .channel(`messages:${groupId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `group_id=eq.${groupId}`
        },
        (payload) => {
          const message = payload.new;
          const messageGroupId = message.group_id || '';
          
          // Get city abbreviation from main groupId
          const cityAbbr = groupId.split('_')[0];
          
          // Check which category this message belongs to based on group_id
          const categories = ['ausgehen', 'kreativität', 'sport'];
          categories.forEach(category => {
            const categoryGroupId = `${cityAbbr}_${category}`;
            if (messageGroupId === categoryGroupId) {
              // Mark as unread if message is from another user
              if (message.sender !== username) {
                setUnreadByCategory(prev => ({
                  ...prev,
                  [category]: true
                }));
              }
            }
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [groupId, username]);

  return { unreadByCategory, markCategoryAsRead };
};
