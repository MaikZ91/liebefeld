import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Message } from '@/types/chatTypes';
import { chatService } from '@/services/chatService';
import { messageService } from '@/services/messageService';
import ChatMessage from './ChatMessage';
import MentionInput from './MentionInput';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface IntelligentCommunityChatProps {
  groupId: string;
  username: string;
  avatar?: string;
  className?: string;
}

const IntelligentCommunityChat: React.FC<IntelligentCommunityChatProps> = ({
  groupId,
  username,
  avatar,
  className
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [replyToMessage, setReplyToMessage] = useState<Message | null>(null);
  const [replyToMessageData, setReplyToMessageData] = useState<{[key: string]: Message}>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const channelRef = useRef<any>(null);

  // Scroll to bottom
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  // Load messages on mount
  useEffect(() => {
    loadMessages();
    setupSubscription();
    
    return () => {
      if (channelRef.current) {
        channelRef.current.unsubscribe();
      }
    };
  }, [groupId]);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messages.length > 0) {
      scrollToBottom();
    }
  }, [messages, scrollToBottom]);

  // Load messages from database
  const loadMessages = async () => {
    try {
      setLoading(true);
      const loadedMessages = await messageService.fetchMessages(groupId);
      setMessages(loadedMessages);
      
      // Build reply message lookup
      const replyLookup: {[key: string]: Message} = {};
      loadedMessages.forEach(msg => {
        replyLookup[msg.id] = msg;
      });
      setReplyToMessageData(replyLookup);
      
    } catch (error) {
      console.error('Error loading messages:', error);
      toast.error('Fehler beim Laden der Nachrichten');
    } finally {
      setLoading(false);
    }
  };

  // Setup real-time subscription
  const setupSubscription = () => {
    try {
      const subscription = chatService.createMessageSubscription(
        groupId,
        (newMessage: Message) => {
          setMessages(prev => {
            // Check if message already exists
            if (prev.find(msg => msg.id === newMessage.id)) {
              return prev;
            }
            const updated = [...prev, newMessage];
            
            // Update reply lookup
            setReplyToMessageData(prev => ({
              ...prev,
              [newMessage.id]: newMessage
            }));
            
            return updated;
          });
          
          // Show notification for mentions
          if (newMessage.mentions?.includes(username) && newMessage.user_name !== username) {
            toast.success(`${newMessage.user_name} hat dich erwähnt!`);
          }
        },
        () => {
          // Force refresh
          loadMessages();
        },
        username
      );
      
      channelRef.current = subscription;
    } catch (error) {
      console.error('Error setting up subscription:', error);
    }
  };

  // Send message with reply and mentions
  const handleSendMessage = async (text: string, replyToId?: string, mentions?: string[]) => {
    if (!text.trim()) return;
    
    try {
      setSending(true);
      await messageService.sendMessage(
        groupId,
        username,
        text,
        avatar,
        null, // mediaUrl
        replyToId,
        mentions
      );
      
      // Clear reply state
      setReplyToMessage(null);
      
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Fehler beim Senden der Nachricht');
    } finally {
      setSending(false);
    }
  };

  // Handle reply to message
  const handleReply = (message: Message) => {
    setReplyToMessage(message);
  };

  // Cancel reply
  const cancelReply = () => {
    setReplyToMessage(null);
  };

  // Handle reaction
  const handleReaction = async (emoji: string) => {
    // Implementation would go here - for now just a placeholder
    console.log('Reaction:', emoji);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-red-500" />
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col h-full", className)}>
      {/* Messages container */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 dark:text-gray-400 py-8">
            Noch keine Nachrichten. Starte das Gespräch! 
          </div>
        ) : (
          messages.map((message, index) => {
            const isConsecutive = index > 0 && 
              messages[index - 1].user_name === message.user_name &&
              new Date(message.created_at).getTime() - new Date(messages[index - 1].created_at).getTime() < 300000; // 5 minutes
            
            const replyTo = message.reply_to ? replyToMessageData[message.reply_to] : null;
            
            return (
              <div key={message.id} className={cn(!isConsecutive && "mt-4")}>
                {!isConsecutive && (
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {message.user_name}
                    </span>
                    <span className="text-xs text-gray-500">
                      {new Date(message.created_at).toLocaleTimeString('de-DE', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                )}
                
                <ChatMessage
                  message={message.text}
                  isConsecutive={isConsecutive}
                  isGroup={true}
                  reactions={message.reactions}
                  onReact={handleReaction}
                  currentUsername={username}
                  messageId={message.id}
                  replyToMessage={replyTo}
                  onReply={handleReply}
                  fullMessage={message}
                />
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className="border-t border-gray-200 dark:border-gray-700 p-4">
        <MentionInput
          username={username}
          groupId={groupId}
          onSendMessage={handleSendMessage}
          isSending={sending}
          placeholder="Schreibe eine Nachricht... (nutze @ um Nutzer zu erwähnen)"
          replyToMessage={replyToMessage}
          onCancelReply={cancelReply}
        />
      </div>
    </div>
  );
};

export default IntelligentCommunityChat;