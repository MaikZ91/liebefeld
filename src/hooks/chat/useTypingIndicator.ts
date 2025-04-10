
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { TypingUser } from '@/types/chatTypes';

export const useTypingIndicator = (groupId: string, username: string) => {
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);
  const [typing, setTyping] = useState(false);

  useEffect(() => {
    if (!groupId) return;

    const typingChannel = supabase
      .channel(`typing:${groupId}`)
      .on('broadcast', { event: 'typing' }, (payload) => {
        const { username: typingUsername, avatar, isTyping } = payload;
        
        if (typingUsername === username) return;
        
        setTypingUsers(prev => {
          const existingUsers = [...prev];
          
          if (isTyping) {
            const existingIndex = existingUsers.findIndex(u => u.username === typingUsername);
            if (existingIndex >= 0) {
              existingUsers[existingIndex] = {
                ...existingUsers[existingIndex],
                lastTyped: new Date()
              };
            } else {
              existingUsers.push({
                username: typingUsername,
                avatar,
                lastTyped: new Date()
              });
            }
          } else {
            return existingUsers.filter(u => u.username !== typingUsername);
          }
          
          return existingUsers;
        });
      })
      .subscribe();

    const typingInterval = setInterval(() => {
      setTypingUsers(prev => {
        const now = new Date();
        const filteredUsers = prev.filter(user => {
          return now.getTime() - user.lastTyped.getTime() < 3000;
        });
        
        if (filteredUsers.length !== prev.length) {
          return filteredUsers;
        }
        return prev;
      });
    }, 2000);

    return () => {
      supabase.removeChannel(typingChannel);
      clearInterval(typingInterval);
    };
  }, [groupId, username]);

  return {
    typingUsers,
    typing,
    setTyping
  };
};
