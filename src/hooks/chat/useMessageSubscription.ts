
import { useEffect, useState, useCallback, useRef } from 'react';
import { Message, TypingUser } from '@/types/chatTypes';
import { chatService } from '@/services/chatService';
import { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

export const useMessageSubscription = (
  groupId: string,
  onNewMessage: (message: Message) => void,
  onForceRefresh: () => void,
  username: string
) => {
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);
  const channelsRef = useRef<RealtimeChannel[]>([]);
  const timeoutsRef = useRef<{[key: string]: NodeJS.Timeout}>({});
  const [isSubscribed, setIsSubscribed] = useState(false);

  // Update typing users callback - memoized for better performance
  const handleTypingUpdate = useCallback((newTypingUser: TypingUser[]) => {
    setTypingUsers(prev => {
      // Clone current typing list
      const currentUsers = [...prev];
      
      // For each new typing user
      newTypingUser.forEach(user => {
        // Find existing user or -1 if not found
        const existingIndex = currentUsers.findIndex(u => u.username === user.username);
        
        if (user.lastTyped) {
          // If a timeout exists for this user, clear it
          if (timeoutsRef.current[user.username]) {
            clearTimeout(timeoutsRef.current[user.username]);
          }
          
          // Set new timeout to remove user after 3 seconds
          timeoutsRef.current[user.username] = setTimeout(() => {
            setTypingUsers(prev => prev.filter(u => u.username !== user.username));
          }, 3000);
          
          // Update or add user
          if (existingIndex >= 0) {
            currentUsers[existingIndex] = user;
          } else {
            currentUsers.push(user);
          }
        } else {
          // Remove user from list
          if (existingIndex >= 0) {
            currentUsers.splice(existingIndex, 1);
          }
        }
      });
      
      return currentUsers;
    });
  }, []);

  useEffect(() => {
    if (!groupId || !username) {
      console.log('No subscription: Group ID or username missing');
      return;
    }
    
    // Add a small delay to prevent too many simultaneous connections
    const setupDelay = setTimeout(() => {
      console.log(`Setting up subscription for group: ${groupId}`);
      setIsSubscribed(false);

      // Ensure Realtime is enabled for the table by making a simple query
      try {
        supabase.from('chat_messages').select('id').limit(1);
        
        // Create message channel - using the optimized version that returns a single channel
        const messageChannel = chatService.createMessageSubscription(
          groupId,
          onNewMessage,
          onForceRefresh,
          username
        );
        
        // Create typing channel
        const typingChannel = chatService.createTypingSubscription(
          groupId,
          username,
          handleTypingUpdate
        );
        
        // Save all channels
        channelsRef.current = [messageChannel, typingChannel].filter(Boolean);
        setIsSubscribed(true);
      } catch (error) {
        console.error('Error setting up subscriptions:', error);
      }
    }, 300);
    
    // Cleanup on component unmount
    return () => {
      clearTimeout(setupDelay);
      console.log(`Ending subscription for group: ${groupId}`);
      
      // Clear all active timeouts
      Object.values(timeoutsRef.current).forEach(timeout => {
        clearTimeout(timeout);
      });
      
      // Unsubscribe all channels
      channelsRef.current.forEach(channel => {
        if (channel) {
          try {
            channel.unsubscribe();
            supabase.removeChannel(channel);
          } catch (e) {
            console.error('Error unsubscribing from channel:', e);
          }
        }
      });
      
      // Reset typing users
      setTypingUsers([]);
    };
  }, [groupId, username, onNewMessage, onForceRefresh, handleTypingUpdate]);

  return { typingUsers, isSubscribed };
};
