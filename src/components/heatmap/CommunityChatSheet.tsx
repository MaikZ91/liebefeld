import React, { useState, useEffect, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { X, Send, Users, MessageSquare, Reply } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useChatMessages } from '@/hooks/chat/useChatMessages';
import { AVATAR_KEY, USERNAME_KEY, UserProfile } from '@/types/chatTypes';
import { getInitials } from '@/utils/chatUIUtils';
import { getChannelColor } from '@/utils/channelColors';
import MessageInput from '@/components/chat/MessageInput';
import MessageReactions from '@/components/chat/MessageReactions';
import { chatService } from '@/services/chatService';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useReplySystem } from '@/hooks/chat/useReplySystem';
import ReplyPreview from '@/components/chat/ReplyPreview';
import TypingIndicator from '@/components/chat/TypingIndicator';
import PollMessage from '@/components/poll/PollMessage';
import UserProfileDialog from '@/components/users/UserProfileDialog';
import { userService } from '@/services/userService';
import { createGroupDisplayName } from '@/utils/groupIdUtils';
import { cities } from '@/contexts/EventContext';
import MeetupProposal from '@/components/chat/MeetupProposal';

interface CommunityChatSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  groupId: string;
  selectedCity: string;
  activeCategory?: string;
  onCategoryChange?: (category: string) => void;
  onOpenUserDirectory?: () => void;
  onShowEvent?: (eventId: string) => void;
}

const CommunityChatSheet: React.FC<CommunityChatSheetProps> = ({
  open,
  onOpenChange,
  groupId,
  selectedCity,
  activeCategory = 'ausgehen',
  onCategoryChange,
  onOpenUserDirectory,
  onShowEvent
}) => {
  const username = typeof window !== 'undefined' ? localStorage.getItem(USERNAME_KEY) || 'Anonymous' : 'Anonymous';
  
  const {
    messages,
    loading,
    error,
    typingUsers,
    chatBottomRef,
    chatContainerRef,
    setMessages
  } = useChatMessages(groupId, username);
  
  // Auto-scroll to bottom when opening the chat
  useEffect(() => {
    if (open && chatBottomRef.current) {
      setTimeout(() => {
        chatBottomRef.current?.scrollIntoView({ behavior: 'auto', block: 'end' });
      }, 150);
    }
  }, [open]);
  
  const { replyTo, startReply, clearReply } = useReplySystem();
  
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [messageFilter, setMessageFilter] = useState<string[]>([activeCategory]);
  const [selectedUserProfile, setSelectedUserProfile] = useState<UserProfile | null>(null);
  const [showUserProfileDialog, setShowUserProfileDialog] = useState(false);
  const [loadingUserProfile, setLoadingUserProfile] = useState(false);
  
  // Update filter when activeCategory changes
  useEffect(() => {
    setMessageFilter([activeCategory]);
    
    // Scroll to bottom when category changes and messages are loaded
    if (chatBottomRef.current && messages.length > 0) {
      setTimeout(() => {
        chatBottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
      }, 200);
    }
  }, [activeCategory, messages.length]);
  
  // Filter messages based on selected categories
  const filteredMessages = useMemo(() => {
    // Single group: always filter by selected category chips
    if (messageFilter.includes('alle')) {
      return messages;
    }

    const stripDiacritics = (s: string) =>
      s.normalize('NFD').replace(/[\u0300-\u036f]/g, '');

    const umlautToAe = (s: string) =>
      s.replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss');

    const categorySynonyms: Record<string, string[]> = {
      'ausgehen': ['ausgehen', 'party', 'konzert', 'festival', 'club', 'nightlife', 'bar'],
      'kreativität': ['kreativität', 'kreativitaet', 'kreativ', 'kultur', 'workshop', 'ausstellung', 'theater', 'lesung'],
      'sport': ['sport', 'fitness', 'yoga', 'run', 'lauf'],
    };

    return messages.filter((message) => {
      const msgLower = (message.text || '').toLowerCase();
      const msgAscii = stripDiacritics(msgLower);
      const msgUmlaut = umlautToAe(msgLower);

      if ((message as any).poll_question) return true;

      return messageFilter.some((category) => {
        const syns = categorySynonyms[category] || [category];
        return syns.some((syn) => {
          const tag = `#${syn.toLowerCase()}`;
          return (
            msgLower.includes(tag) ||
            msgAscii.includes(stripDiacritics(tag)) ||
            msgUmlaut.includes(umlautToAe(tag))
          );
        });
      });
    });
  }, [messages, messageFilter]);
  
  const handleSendMessage = async () => {
    if (!input.trim() || !username) return;
    
    try {
      setSending(true);
      
      let messageText = input.trim();
      const categoryLabel = `#${activeCategory.toLowerCase()}`;
      messageText = `${categoryLabel} ${messageText}`;
      
      setInput('');
      
      if (replyTo) {
        const { data, error } = await supabase
          .from('chat_messages')
          .insert([{
            group_id: groupId,
            sender: username,
            text: messageText,
            avatar: localStorage.getItem(AVATAR_KEY),
            reply_to_message_id: replyTo.messageId,
            reply_to_sender: replyTo.sender,
            reply_to_text: replyTo.text.length > 100 ? replyTo.text.substring(0, 100) + '...' : replyTo.text,
            read_by: [username]
          }])
          .select('id')
          .single();
          
        if (error) throw error;
        
        if (data?.id) {
          await supabase.functions.invoke('send-push', {
            body: {
              sender: username,
              text: `@${replyTo.sender} ${username} hat auf deine Nachricht geantwortet: "${messageText.length > 50 ? messageText.substring(0, 50) + '...' : messageText}"`,
              message_id: data.id,
              mention_user: replyTo.sender
            }
          });
        }
        
        clearReply();
      } else {
        await chatService.sendMessage(groupId, messageText, username);
      }
      
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Nachricht konnte nicht gesendet werden');
    } finally {
      setSending(false);
    }
  };
  
  const handleAvatarClick = async (username: string) => {
    setLoadingUserProfile(true);
    setShowUserProfileDialog(true);
    
    try {
      const profile = await userService.getUserByUsername(username);
      setSelectedUserProfile(profile);
    } catch (error) {
      console.error('Error fetching user profile:', error);
      toast.error('Fehler beim Laden des Profils');
      setShowUserProfileDialog(false);
    } finally {
      setLoadingUserProfile(false);
    }
  };
  
  const handleReaction = async (messageId: string, emoji: string) => {
    try {
      setMessages(prevMessages => {
        return prevMessages.map(msg => {
          if (msg.id === messageId) {
            const reactions = Array.isArray(msg.reactions) ? [...msg.reactions] : [];
            const existingReactionIndex = reactions.findIndex((r: any) => r.emoji === emoji);
            
            if (existingReactionIndex >= 0) {
              const reaction = reactions[existingReactionIndex];
              const users = reaction.users || [];
              const userIndex = users.indexOf(username);
              
              if (userIndex >= 0) {
                users.splice(userIndex, 1);
                if (users.length === 0) {
                  reactions.splice(existingReactionIndex, 1);
                }
              } else {
                users.push(username);
              }
            } else {
              reactions.push({ emoji, users: [username] });
            }
            
            return { ...msg, reactions };
          }
          return msg;
        });
      });
      
      await chatService.toggleReaction(messageId, emoji, username);
    } catch (error) {
      console.error('Error toggling reaction:', error);
    }
  };
  
  const getCommunityDisplayName = (category: string, cityAbbr: string): string => {
    return createGroupDisplayName(category, cityAbbr, cities);
  };
  
  const formatTime = (isoDateString: string) => {
    const date = new Date(isoDateString);
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / 60000);

    if (diff < 1) return 'gerade eben';
    if (diff < 60) return `vor ${diff}m`;
    if (diff < 24 * 60) return `vor ${Math.floor(diff / 60)}h`;
    return `vor ${Math.floor(diff / 1440)}d`;
  };
  
  // Hide global bottom navigation while Community Chat is open
  useEffect(() => {
    if (open) document.body.classList.add('community-chat-open');
    else document.body.classList.remove('community-chat-open');
    return () => document.body.classList.remove('community-chat-open');
  }, [open]);
  
  if (!open) return null;
  
  return (
    <>
      <div className="fixed top-20 bottom-0 right-4 left-4 md:left-auto md:w-[520px] z-[9999] animate-fade-in flex flex-col">
        <Card className="relative overflow-hidden rounded-3xl border border-white/5 bg-black flex-1 flex flex-col">
          {/* Close Button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onOpenChange(false)}
            className="absolute top-3 right-3 z-10 h-10 w-10 rounded-full bg-red-600/90 hover:bg-red-700 text-white shadow-lg border border-white/20"
          >
            <X className="w-5 h-5" />
          </Button>
          
          {/* Category Filter - Urban Dark Style */}
          <div className="relative px-4 pt-4 pb-2 border-b border-white/5">
            <div className="flex gap-2 overflow-x-auto scrollbar-none flex-nowrap">
                {['#ausgehen', '#kreativität', '#sport'].map((category) => {
                  const catKey = category.replace('#', '');
                  const isActive = messageFilter.includes(catKey);
                  const chipBase = 'h-9 px-5 text-sm font-medium rounded-full transition-all duration-200 shrink-0 border';
                  
                  return (
                    <Button
                      key={category}
                      variant="ghost"
                      size="sm"
                      className={cn(
                        chipBase,
                        isActive 
                          ? 'bg-white/10 text-white border-white/20'
                          : 'bg-transparent text-white/60 hover:text-white hover:bg-white/5 border-white/10'
                      )}
                      onClick={() => {
                        setMessageFilter([catKey]);
                        onCategoryChange?.(catKey);
                      }}
                    >
                      {category}
                    </Button>
                  );
                })}
              </div>
          </div>
          
          {/* Messages */}
          <div 
            ref={chatContainerRef}
            className="flex-1 overflow-y-auto px-4 py-4 space-y-4 bg-black"
            style={{
              scrollbarWidth: 'thin',
              scrollbarColor: 'rgba(255, 255, 255, 0.2) transparent'
            }}
          >
              {loading && filteredMessages.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-white/50 text-sm">Lade Nachrichten...</div>
                </div>
              ) : filteredMessages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full space-y-3">
                  <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center">
                    <MessageSquare className="w-6 h-6 text-white/30" />
                  </div>
                  <div className="text-white/50 text-sm text-center">
                    Noch keine Nachrichten.<br/>
                    <span className="text-white/40 text-xs">Sei der Erste und starte die Unterhaltung!</span>
                  </div>
                </div>
              ) : (
                filteredMessages.map((message) => {
                  const msgWithPoll = message as any;
                  
                  // Check if this is a meetup proposal
                  const isMeetupProposal = 
                    message.text?.includes('🎉 Meetup-Vorschlag für') &&
                    msgWithPoll.event_id &&
                    msgWithPoll.event_title;
                  
                  if (isMeetupProposal) {
                    return (
                      <MeetupProposal
                        key={message.id}
                        messageId={message.id}
                        eventId={msgWithPoll.event_id}
                        eventTitle={msgWithPoll.event_title}
                        eventDate={msgWithPoll.event_date}
                        eventLocation={msgWithPoll.event_location}
                        messageText={message.text}
                        meetupResponses={msgWithPoll.meetup_responses || { 'bin dabei': [], 'diesmal nicht': [] }}
                        onShowEvent={onShowEvent}
                        sender={message.sender || message.user_name}
                        senderAvatar={message.avatar || message.user_avatar}
                      />
                    );
                  }
                  
                  if (msgWithPoll.poll_question) {
                    return (
                      <PollMessage
                        key={message.id}
                        pollData={{
                          question: msgWithPoll.poll_question,
                          options: msgWithPoll.poll_options,
                          votes: msgWithPoll.poll_votes || {},
                          allowMultiple: msgWithPoll.poll_allow_multiple
                        }}
                        messageId={message.id}
                      />
                    );
                  }
                  
                  const isOwnMessage = message.user_name === username;
                  
                  return (
                    <div
                      key={message.id}
                      className={cn(
                        "flex gap-3 animate-fade-in",
                        isOwnMessage ? "justify-end" : "justify-start"
                      )}
                    >
                      {!isOwnMessage && (
                        <Avatar 
                          className="w-8 h-8 shrink-0 border border-white/10 cursor-pointer"
                          onClick={() => handleAvatarClick(message.user_name)}
                        >
                          <AvatarImage src={message.user_avatar || undefined} />
                          <AvatarFallback className="bg-primary/20 text-white text-xs">
                            {getInitials(message.user_name)}
                          </AvatarFallback>
                        </Avatar>
                      )}
                      
                      <div className={cn(
                        "flex flex-col gap-1 max-w-[75%]",
                        isOwnMessage && "items-end"
                      )}>
                        {!isOwnMessage && (
                          <span className="text-xs text-white/60 px-1">{message.user_name}</span>
                        )}
                        
                        <div
                          className={cn(
                            "rounded-2xl px-4 py-2.5 relative group",
                            isOwnMessage
                              ? "bg-gradient-to-r from-red-600 to-red-700 text-white"
                              : "bg-white/10 text-white border border-white/10"
                          )}
                        >
                          {message.reply_to_sender && (
                            <div className="text-xs opacity-70 mb-1 pb-1 border-b border-white/20">
                              <Reply className="inline-block w-3 h-3 mr-1" />
                              Antwort an {message.reply_to_sender}
                            </div>
                          )}
                          
                          <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                            {message.text}
                          </p>
                          
                          <span className="text-[10px] opacity-60 mt-1 block">
                            {formatTime(message.created_at)}
                          </span>
                          
                          {/* Context Menu */}
                          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => startReply({
                                messageId: message.id,
                                sender: message.user_name,
                                text: message.text
                              })}
                              className="h-6 w-6 p-0 text-white/70 hover:text-white hover:bg-white/10"
                            >
                              <Reply className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                        
                        {message.reactions && message.reactions.length > 0 && (
                          <MessageReactions
                            reactions={message.reactions}
                            onReact={(emoji) => handleReaction(message.id, emoji)}
                            currentUsername={username}
                          />
                        )}
                      </div>
                    </div>
                  );
                })
              )}
              
              {typingUsers.length > 0 && (
                <TypingIndicator typingUsers={typingUsers} />
              )}
              
              <div ref={chatBottomRef} />
            </div>
            
          {/* Input - Urban Dark Style */}
          <div className="relative px-4 pb-4 pt-2 bg-black border-t border-white/5">
            {replyTo && (
              <div className="mb-2">
                <ReplyPreview 
                  replyTo={replyTo} 
                  onCancel={clearReply}
                  groupType={activeCategory as 'ausgehen' | 'sport' | 'kreativität'}
                />
              </div>
            )}
            <div className="flex items-center gap-2 bg-white/5 rounded-full px-4 py-2.5 border border-white/10">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                placeholder="Nachricht schreiben..."
                className="flex-1 bg-transparent border-none outline-none text-white placeholder:text-white/40 text-sm"
                disabled={sending}
              />
              <Button
                size="icon"
                variant="ghost"
                onClick={handleSendMessage}
                disabled={sending || !input.trim()}
                className="h-8 w-8 rounded-full hover:bg-white/10 text-white/60 hover:text-white"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </Card>
      </div>
      
      <UserProfileDialog
        userProfile={selectedUserProfile}
        open={showUserProfileDialog}
        onOpenChange={setShowUserProfileDialog}
        loading={loadingUserProfile}
      />
    </>
  );
};

export default CommunityChatSheet;
