// src/components/chat/IntelligentCommunityChat.tsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Message } from '@/types/chatTypes';
import { chatService } from '@/services/chatService';
import { messageService } from '@/services/messageService';
import ChatMessage from './ChatMessage';
// import MentionInput from './MentionInput'; // Auskommentiert
import { Loader2, Send, X, Reply } from 'lucide-react'; // X und Reply hinzugefügt für temporäre UI
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { Textarea } from '@/components/ui/textarea'; // Textarea hinzugefügt
import { Button } from '@/components/ui/button'; // Button hinzugefügt

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

  // Temporärer State für die Nachricht (ersetzt MentionInput)
  const [currentMessageText, setCurrentMessageText] = useState("");

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
          
          // Show notification for mentions - HINWEIS: Mentions sind jetzt deaktiviert
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

  // Send message without reply and mentions for now
  const handleSendMessage = async () => {
    if (!currentMessageText.trim()) return;
    
    try {
      setSending(true);
      await messageService.sendMessage(
        groupId,
        username,
        currentMessageText,
        avatar,
        null, // mediaUrl
        replyToMessage?.id, // replyToId
        undefined // mentions, da Mentions deaktiviert sind
      );
      
      // Clear reply state and input
      setReplyToMessage(null);
      setCurrentMessageText("");
      
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

      {/* Temporärer Input-Bereich (ersetzt MentionInput) */}
      <div className="border-t border-gray-200 dark:border-gray-700 p-4">
        {replyToMessage && (
          <div className="flex items-center gap-2 p-2 bg-gray-100 dark:bg-gray-800 rounded-t-lg border-l-4 border-blue-500 mb-2">
            <Reply className="h-4 w-4 text-blue-500" />
            <div className="flex-1 text-sm">
              <span className="font-medium text-blue-600 dark:text-blue-400">
                Antwort an {replyToMessage.user_name}:
              </span>
              <div className="text-gray-600 dark:text-gray-300 truncate">
                {replyToMessage.text}
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={cancelReply}
              className="h-6 w-6 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}
        <div className="relative">
          <Textarea
            placeholder="Schreibe eine Nachricht..."
            value={currentMessageText}
            onChange={(e) => setCurrentMessageText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            className="min-h-[60px] resize-none pr-14 border-2 border-red-500 focus:border-red-600 focus:ring-2 focus:ring-red-500"
          />
          <Button
            onClick={handleSendMessage}
            disabled={sending || !currentMessageText.trim()}
            className="rounded-full min-w-[32px] h-8 w-8 absolute right-2 bottom-2 p-0 bg-red-500 hover:bg-red-600 text-white"
          >
            {sending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default IntelligentCommunityChat;