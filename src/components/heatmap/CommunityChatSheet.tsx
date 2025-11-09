import React, { useState, useEffect, useMemo } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
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

interface CommunityChatSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  groupId: string;
  selectedCity: string;
  activeCategory?: string;
  onCategoryChange?: (category: string) => void;
  onOpenUserDirectory?: () => void;
}

const CommunityChatSheet: React.FC<CommunityChatSheetProps> = ({
  open,
  onOpenChange,
  groupId,
  selectedCity,
  activeCategory = 'ausgehen',
  onCategoryChange,
  onOpenUserDirectory
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
  }, [activeCategory]);
  
  // Filter messages based on selected categories
  const filteredMessages = useMemo(() => {
    if (messageFilter.includes('alle')) {
      return messages;
    }
    
    return messages.filter(message => {
      if ((message as any).poll_question) {
        return true;
      }
      
      const messageText = message.text.toLowerCase();
      return messageFilter.some(category => 
        messageText.includes(`#${category.toLowerCase()}`)
      );
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
  
  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent 
          side="bottom" 
          className="h-[85vh] p-0 border-0 bg-transparent"
        >
          <div className="h-full rounded-t-3xl overflow-hidden border-t border-white/10 bg-black/70 backdrop-blur-xl shadow-[0_-20px_80px_rgba(239,68,68,0.25)]">
            {/* Gradient overlay */}
            <div
              className="pointer-events-none absolute inset-0"
              style={{
                background: "radial-gradient(120% 60% at 50% 0%, rgba(239,68,68,0.25) 0%, rgba(239,68,68,0.05) 30%, transparent 60%)",
              }}
            />
            
            {/* Header */}
            <div className="relative flex items-center justify-between px-4 py-3 border-b border-white/10 bg-black/40 backdrop-blur-xl">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="absolute -inset-0.5 rounded-full bg-red-500/30 blur-md" />
                  <div className="relative w-9 h-9 rounded-full bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center ring-2 ring-white/10">
                    <MessageSquare className="w-5 h-5 text-white" />
                  </div>
                </div>
                <div>
                  <div className="text-white font-semibold leading-tight">
                    {getCommunityDisplayName(activeCategory, selectedCity)}
                  </div>
                  <div className="text-[11px] text-white/50">Community Chat</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {onOpenUserDirectory && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={onOpenUserDirectory}
                    className="h-9 w-9 rounded-full text-white/70 hover:text-white hover:bg-white/10"
                  >
                    <Users className="w-4 h-4" />
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onOpenChange(false)}
                  className="h-9 w-9 rounded-full text-white/70 hover:text-white hover:bg-white/10"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
            
            {/* Category Filter */}
            <div className="relative px-4 py-3 bg-black/40 backdrop-blur-xl border-b border-white/10">
              <div className="flex gap-2 overflow-x-auto scrollbar-none flex-nowrap">
                {['alle', 'ausgehen', 'kreativität', 'sport'].map((category) => {
                  const isActive = messageFilter.includes(category);
                  const isAll = category === 'alle';
                  const chipBase = 'h-8 px-4 text-xs font-medium rounded-full transition-all duration-200 shrink-0';
                  
                  if (isAll) {
                    return (
                      <Button
                        key={category}
                        variant="ghost"
                        size="sm"
                        className={cn(
                          chipBase,
                          isActive 
                            ? 'bg-gradient-to-r from-red-600 to-red-700 text-white shadow-lg shadow-red-500/30' 
                            : 'bg-white/5 text-white/60 hover:text-white hover:bg-white/10 border border-white/10'
                        )}
                        onClick={() => {
                          setMessageFilter(['alle']);
                          onCategoryChange?.('alle');
                        }}
                      >
                        #{category}
                      </Button>
                    );
                  }
                  
                  const type = category as 'ausgehen' | 'kreativität' | 'sport';
                  const colors = getChannelColor(type);
                  
                  return (
                    <Button
                      key={category}
                      variant="ghost"
                      size="sm"
                      style={
                        isActive 
                          ? { ...colors.bgStyle, ...colors.borderStyle, color: 'white' } 
                          : { ...colors.borderStyle, ...colors.textStyle }
                      }
                      className={cn(
                        chipBase,
                        'border shadow-sm',
                        !isActive && 'bg-white/5 hover:bg-white/10',
                        isActive && 'shadow-lg'
                      )}
                      onClick={() => {
                        setMessageFilter([category]);
                        onCategoryChange?.(category);
                      }}
                    >
                      #{category}
                    </Button>
                  );
                })}
              </div>
            </div>
            
            {/* Messages */}
            <div 
              ref={chatContainerRef}
              className="flex-1 overflow-y-auto px-4 py-4 space-y-3 scrollbar-thin scrollbar-thumb-white/20"
              style={{ height: 'calc(100% - 200px)' }}
            >
              {loading && filteredMessages.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-white/50 text-sm">Lade Nachrichten...</div>
                </div>
              ) : filteredMessages.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-white/50 text-sm">Noch keine Nachrichten. Sei der Erste!</div>
                </div>
              ) : (
                filteredMessages.map((message) => {
                  const msgWithPoll = message as any;
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
                          className="w-8 h-8 shrink-0 ring-2 ring-white/10 cursor-pointer"
                          onClick={() => handleAvatarClick(message.user_name)}
                        >
                          <AvatarImage src={message.user_avatar || undefined} />
                          <AvatarFallback className="bg-gradient-to-br from-red-500 to-rose-600 text-white text-xs">
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
            
            {/* Input Area */}
            <div className="relative border-t border-white/10 bg-black/60 backdrop-blur-xl">
              {replyTo && (
                <div className="px-4 pt-3">
                  <ReplyPreview 
                    replyTo={replyTo} 
                    onCancel={clearReply}
                    groupType={activeCategory as 'ausgehen' | 'sport' | 'kreativität'}
                  />
                </div>
              )}
              
              <div className="p-3">
                <MessageInput
                  username={username}
                  groupId={groupId}
                  handleSendMessage={handleSendMessage}
                  isSending={sending}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  placeholder="Nachricht schreiben..."
                  mode="community"
                  groupType={activeCategory as 'ausgehen' | 'sport' | 'kreativität'}
                  replyTo={replyTo}
                  onClearReply={clearReply}
                />
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>
      
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
