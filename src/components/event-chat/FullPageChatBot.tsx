// src/components/event-chat/FullPageChatBot.tsx
import React, { useEffect, useState, useMemo } from 'react';
import MessageList from './MessageList';
import ChatInput from './ChatInput';
import RecentQueries from './RecentQueries';
import { useChatMessages } from '@/hooks/chat/useChatMessages';

import { AVATAR_KEY, USERNAME_KEY, EventShare } from '@/types/chatTypes';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getInitials } from '@/utils/chatUIUtils'; 
import TypingIndicator from '@/components/chat/TypingIndicator';
import ChatMessage from '@/components/chat/ChatMessage';
import MessageReactions from '@/components/chat/MessageReactions';
import { chatService } from '@/services/chatService';
import { useEventContext, cities } from '@/contexts/EventContext';
import { createGroupDisplayName } from '@/utils/groupIdUtils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { getChannelColor } from '@/utils/channelColors';
import UserProfileDialog from '@/components/users/UserProfileDialog';
import { userService } from '@/services/userService';
import { UserProfile } from '@/types/chatTypes';
import { toast } from 'sonner';
import { useChatPreferences } from '@/contexts/ChatPreferencesContext';
import PollMessage from '@/components/poll/PollMessage';
import { supabase } from '@/integrations/supabase/client';
import { useReplySystem, ReplyData } from '@/hooks/chat/useReplySystem';
import MessageInput from '@/components/chat/MessageInput';
import ReplyPreview from '@/components/chat/ReplyPreview';
import { useOnboardingLogic } from '@/hooks/chat/useOnboardingLogic';
import { Search } from 'lucide-react';

interface FullPageChatBotProps {
  chatLogic: any;
  activeChatModeValue: 'ai' | 'community' | 'onboarding';
  communityGroupId: string;
  onAddEvent?: () => void;
  hideButtons?: boolean;
  activeCategory?: string;
  onCategoryChange?: (category: string) => void;
  onJoinEventChat?: (eventId: string, eventTitle: string) => void;
  onCreatePoll?: (poll: { question: string; options: string[]; allowMultiple?: boolean }) => void;
  hideInput?: boolean;
  externalInput?: string;
  setExternalInput?: (value: string) => void;
  onExternalSendHandlerChange?: (handler: ((input?: string | any) => Promise<void>) | null) => void;
  embedded?: boolean;
  onboardingComplete?: () => void;
}

const FullPageChatBot: React.FC<FullPageChatBotProps> = ({
  chatLogic,
  activeChatModeValue,
  communityGroupId,
  onAddEvent,
  activeCategory: externalActiveCategory = 'Ausgehen',
  onCategoryChange: externalOnCategoryChange,
  onJoinEventChat,
  onCreatePoll,
  hideInput = false,
  externalInput = '',
  setExternalInput,
  onExternalSendHandlerChange,
  embedded = false,
  onboardingComplete
}) => {
  // Onboarding logic
  const { selectedCity, setSelectedCity } = useEventContext();
  const onboardingLogic = useOnboardingLogic(onboardingComplete, setSelectedCity);
  // Use global chat preferences context
  const { activeCategory, setActiveCategory } = useChatPreferences();
  
  const {
    messages: aiMessages,
    input: aiInput,
    setInput: setAiInput,
    isTyping: aiTyping,
    globalQueries,
    showRecentQueries,
    setShowRecentQueries,
    messagesEndRef,
    inputRef,
    examplePrompts,
    isHeartActive,
    handleSendMessage: aiSendMessage,
    handleDateSelect,
    handleExamplePromptClick,
    handleKeyPress: aiKeyPress,
    handleInputChange: aiInputChange,
    handleHeartClick,
    toggleRecentQueries,
    showAnimatedPrompts 
  } = chatLogic;

  const username =
    typeof window !== 'undefined'
      ? localStorage.getItem(USERNAME_KEY) || 'Anonymous'
      : 'Anonymous';

  const {
    messages: communityMessages,
    loading: communityLoading,
    error: communityError,
    typingUsers,
    chatBottomRef,
    chatContainerRef,
    addOptimisticMessage,
    setMessages
  } = useChatMessages(communityGroupId, username);
  
  // Reply system
  const { replyTo, startReply, clearReply } = useReplySystem();
  
  // Community chat state - managed externally via props
  const [communityInput, setCommunityInput] = useState('');
  const [communitySending, setCommunitySending] = useState(false);
  
  
  // Create send function directly instead of using external component
  const communitySendMessage = async () => {
    if (!communityInput.trim() || !username) return;
    
    try {
      setCommunitySending(true);
      
      // Format message with category label and reply info
      let messageText = communityInput.trim();
      const categoryLabel = `#${activeCategory.toLowerCase()}`;
      messageText = `${categoryLabel} ${messageText}`;
      
      // Clear input immediately
      setCommunityInput('');
      // Also clear external input to sync with header
      if (setExternalInput) {
        setExternalInput('');
      }
      
      // Send message with reply data if available
      if (replyTo) {
        // Insert message with reply data into database directly
        const { data, error } = await supabase
          .from('chat_messages')
          .insert([{
            group_id: communityGroupId,
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
        
        // Send notification for reply
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
        // Send directly to database via chatService
        await chatService.sendMessage(communityGroupId, messageText, username);
      }
      
    } catch (error) {
      console.error('Error sending community message:', error);
      toast.error('Nachricht konnte nicht gesendet werden');
    } finally {
      setCommunitySending(false);
    }
  };

  // Filter state for community chat - use context
  const [messageFilter, setMessageFilter] = useState<string[]>([activeCategory]);

  // Update messageFilter when activeCategory changes
  useEffect(() => {
    const newFilter = [activeCategory];
    console.log('FullPageChatBot: updating messageFilter to:', newFilter);
    setMessageFilter(newFilter);
  }, [activeCategory]);
  
  // User profile dialog state
  const [selectedUserProfile, setSelectedUserProfile] = useState<UserProfile | null>(null);
  const [showUserProfileDialog, setShowUserProfileDialog] = useState(false);
  const [loadingUserProfile, setLoadingUserProfile] = useState(false);
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);

  useEffect(() => {
    if (activeChatModeValue === 'community' && setExternalInput && externalInput !== communityInput) {
      setCommunityInput(externalInput);
    }
  }, [externalInput, activeChatModeValue, setCommunityInput]);

  useEffect(() => {
    if (onExternalSendHandlerChange) {
      if (activeChatModeValue === 'community') {
        onExternalSendHandlerChange(communitySendMessage);
      } else if (activeChatModeValue === 'ai') {
        onExternalSendHandlerChange(aiSendMessage);
      } else {
        onExternalSendHandlerChange(null);
      }
    }
    
    return () => {
      if (onExternalSendHandlerChange) {
        onExternalSendHandlerChange(null);
      }
    };
  }, [activeChatModeValue, communitySendMessage, aiSendMessage, onExternalSendHandlerChange]);

  const queriesToRender = globalQueries.length > 0 ? globalQueries : [];

  const formatTime = (isoDateString: string) => {
    const date = new Date(isoDateString);
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / 60000);

    if (diff < 1) return 'gerade eben';
    if (diff < 60) return `vor ${diff}m`;
    if (diff < 24 * 60) return `vor ${Math.floor(diff / 60)}h`;
    return `vor ${Math.floor(diff / 1440)}d`;
  };

  const getCommunityDisplayName = (category: string, cityAbbr: string): string => {
    return createGroupDisplayName(category, cityAbbr, cities);
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
      console.log('FullPageChatBot: Toggling reaction', { messageId, emoji, username });
      
      // Optimistic update - update UI immediately
      setMessages(prevMessages => {
        return prevMessages.map(msg => {
          if (msg.id === messageId) {
            const reactions = Array.isArray(msg.reactions) ? [...msg.reactions] : [];
            const existingReactionIndex = reactions.findIndex((r: any) => r.emoji === emoji);
            
            if (existingReactionIndex >= 0) {
              // Reaction exists, toggle user
              const reaction = reactions[existingReactionIndex];
              const users = reaction.users || [];
              const userIndex = users.indexOf(username);
              
              if (userIndex >= 0) {
                // Remove user
                users.splice(userIndex, 1);
                if (users.length === 0) {
                  reactions.splice(existingReactionIndex, 1);
                }
              } else {
                // Add user
                users.push(username);
              }
            } else {
              // Add new reaction
              reactions.push({ emoji, users: [username] });
            }
            
            console.log('FullPageChatBot: Optimistic update applied', { messageId, reactions });
            return { ...msg, reactions };
          }
          return msg;
        });
      });
      
      // Then update the database
      await chatService.toggleReaction(messageId, emoji, username);
      console.log('FullPageChatBot: Reaction toggled successfully');
    } catch (error) {
      console.error('FullPageChatBot: Error toggling reaction:', error);
      // TODO: Revert optimistic update on error
    }
  };

  const wrappedCommunityInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setCommunityInput(e.target.value);
  };

  const wrappedCommunityKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && communitySendMessage) {
      e.preventDefault();
      communitySendMessage();
    }
  };

  const currentInput = activeChatModeValue === 'ai' ? aiInput : communityInput;
  const currentSetInput = activeChatModeValue === 'ai' ? setAiInput : setCommunityInput;
  const currentHandleSendMessage = activeChatModeValue === 'ai' ? aiSendMessage : (communitySendMessage || (() => Promise.resolve()));
  const currentIsTyping = activeChatModeValue === 'ai' ? aiTyping : communitySending;
  const currentHandleKeyPress = activeChatModeValue === 'ai' ? aiKeyPress : wrappedCommunityKeyDown;
  const currentHandleInputChange = activeChatModeValue === 'ai' ? aiInputChange : wrappedCommunityInputChange;


  useEffect(() => {
    if (activeChatModeValue === 'ai' && messagesEndRef?.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'auto', block: 'end' });
    }
  }, [aiMessages, aiTyping, activeChatModeValue, messagesEndRef]);

  useEffect(() => {
    if (activeChatModeValue === 'community' && chatBottomRef?.current) {
      chatBottomRef.current.scrollIntoView({ behavior: 'auto', block: 'end' });
    }
  }, [communityMessages, communitySending, activeChatModeValue, chatBottomRef]);

  // Filter messages based on selected categories
  const filteredCommunityMessages = useMemo(() => {
    if (messageFilter.includes('alle')) {
      return communityMessages;
    }
    
    return communityMessages.filter(message => {
      // Always show poll messages regardless of category
      if ((message as any).poll_question) {
        return true;
      }
      
      // Check if message contains any of the selected hashtags
      const messageText = message.text.toLowerCase();
      return messageFilter.some(category => 
        messageText.includes(`#${category.toLowerCase()}`)
      );
    });
  }, [communityMessages, messageFilter]);

  useEffect(() => {
    if (activeChatModeValue !== 'community') return;
    const el = chatContainerRef?.current;
    if (!el) return;
    const handler = () => {
      const threshold = 80;
      const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < threshold;
      setShowScrollToBottom(!atBottom);
    };
    handler();
    el.addEventListener('scroll', handler);
    return () => el.removeEventListener('scroll', handler);
  }, [chatContainerRef, activeChatModeValue, filteredCommunityMessages.length, typingUsers.length]);

  return (
    <div className={embedded ? "flex flex-col h-full min-h-0 bg-black" : "flex flex-col h-screen min-h-0 bg-black"}>
      {/* Compact Urban Category Filter für Community Chat */}
      {activeChatModeValue === 'community' && (
        <div className="sticky top-0 z-[60] bg-black border-b border-white/5">
          <div className="px-4 py-3">
            <div className="flex gap-2 flex-nowrap">
              {['ausgehen', 'kreativität', 'sport'].map((category) => {
                const isActive = messageFilter.includes(category);
                
                return (
                  <button
                    key={category}
                    className={`h-7 px-3 text-xs font-medium rounded-full transition-all duration-200 border flex-1 ${isActive ? 'bg-white/10 text-white border-white/20' : 'bg-transparent text-white/60 hover:text-white hover:bg-white/5 border-white/10'}`}
                    onClick={() => {
                      setActiveCategory(category);
                    }}
                  >
                    #{category}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}


      <div className="flex-1 min-h-0 overflow-y-auto scrollbar-none bg-black px-4 py-4">
        {activeChatModeValue === 'onboarding' ? (
          <div className="px-4 py-4 space-y-4">
            {onboardingLogic.messages.map((msg, index) => (
              <div key={msg.id} className="animate-fade-in" style={{animationDelay: `${index * 0.1}s`}}>
                <div className={`flex items-start gap-2 ${msg.isBot ? 'justify-start' : 'justify-end'}`}>
                  {msg.isBot && (
                    <div className="relative shrink-0">
                      <Avatar className="h-8 w-8 border border-white/10">
                        <AvatarImage src={onboardingLogic.chatbotAvatar} />
                        <AvatarFallback className="bg-primary/20 text-white text-xs">
                          MIA
                        </AvatarFallback>
                      </Avatar>
                    </div>
                  )}
                  
                  <div className={`flex flex-col gap-2 ${msg.isBot ? '' : 'items-end'}`}>
                    <div className={`px-4 py-3 rounded-2xl max-w-[80%] ${
                      msg.isBot 
                        ? 'bg-white/10 backdrop-blur-sm border border-white/10' 
                        : 'bg-gradient-to-r from-red-600 to-red-700 text-white shadow-lg shadow-red-500/20'
                    }`}>
                      <p className="text-sm text-white whitespace-pre-wrap leading-relaxed">
                        {msg.message}
                      </p>
                    </div>
                    
                    {msg.hasButtons && msg.buttons && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {msg.buttons.map((button, btnIndex) => {
                          const isInterestButton = onboardingLogic.interests.some(i => button.text.includes(i.text));
                          const isSelected = isInterestButton && onboardingLogic.userData.interests.includes(
                            onboardingLogic.interests.find(i => button.text.includes(i.text))?.text || ''
                          );
                          
                          return (
                            <Button
                              key={btnIndex}
                              variant={button.variant}
                              size="sm"
                              onClick={button.action}
                              className={`text-xs h-auto py-2 ${
                                isSelected 
                                  ? 'bg-gradient-to-r from-red-600 to-red-700 text-white border-transparent' 
                                  : ''
                              }`}
                            >
                              {button.text}
                            </Button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
            
            {onboardingLogic.isTyping && (
              <div className="flex items-start gap-2">
                <Avatar className="h-8 w-8 border border-white/10">
                  <AvatarImage src={onboardingLogic.chatbotAvatar} />
                  <AvatarFallback className="bg-primary/20 text-white text-xs">MIA</AvatarFallback>
                </Avatar>
                <div className="px-4 py-3 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/10">
                  <TypingIndicator typingUsers={[]} />
                </div>
              </div>
            )}
            
            <div ref={onboardingLogic.messagesEndRef} />
          </div>
        ) : activeChatModeValue === 'ai' ? (
          <div className={hideInput ? "pt-4 px-3" : "pt-32 px-3"}> 
            <MessageList
              messages={aiMessages}
              isTyping={aiTyping}
              handleDateSelect={handleDateSelect}
              messagesEndRef={messagesEndRef}
              examplePrompts={examplePrompts}
              handleExamplePromptClick={handleExamplePromptClick}
              onJoinEventChat={onJoinEventChat}
              onSuggestionClick={aiSendMessage}
            />
            <div ref={messagesEndRef} />
          </div>
        ) : (
          <div className="h-full min-h-0 flex flex-col">
            {communityError && (
              <div className="text-center text-red-500 text-lg font-semibold py-4">
                Error: {communityError}
              </div>
            )}

            <div
              ref={chatContainerRef}
              className="flex-1 min-h-0 overflow-y-auto scrollbar-none px-4 py-4"
            >
              <div className="space-y-4 pb-20">
                {filteredCommunityMessages.length === 0 && !communityLoading && !communityError && (
                  <div className="flex flex-col items-center justify-center h-full space-y-3">
                    <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center">
                      <Search className="w-6 h-6 text-white/30" />
                    </div>
                    <div className="text-white/50 text-sm text-center">
                      {messageFilter.includes('alle') 
                        ? 'Noch keine Nachrichten im Community Chat'
                        : `Keine Nachrichten in den gewählten Kategorien`
                      }<br/>
                      <span className="text-white/40 text-xs">Starte die Unterhaltung!</span>
                    </div>
                  </div>
                )}

                {filteredCommunityMessages.map((message, index) => {
                   const msgWithPoll = message as any;
                   
                   // Poll message
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
                   
                   // Check if message is meetup proposal
                   const isMeetupProposal = msgWithPoll.event_id && msgWithPoll.event_title && message.text.includes('Meetup-Vorschlag');
                   
                    if (isMeetupProposal) {
                      return (
                        <ChatMessage
                          key={message.id}
                          message={message.text}
                          eventId={msgWithPoll.event_id}
                          eventTitle={msgWithPoll.event_title}
                          eventDate={msgWithPoll.event_date}
                          eventLocation={msgWithPoll.event_location}
                          meetupResponses={msgWithPoll.meetup_responses}
                          messageId={message.id}
                          sender={message.user_name}
                          avatar={message.user_avatar}
                          onShowEvent={(eventId) => {
                            // Use chatLogic's handleEventLinkClick to show event in AI dialog
                            if (chatLogic && chatLogic.handleEventLinkClick) {
                              chatLogic.handleEventLinkClick(eventId);
                            } else {
                              toast.error('AI Chat nicht verfügbar');
                            }
                          }}
                        />
                      );
                    }
                   
                   // Regular message - matching CommunityChatSheet style
                   const isOwnMessage = message.user_name === username;
                   
                   return (
                     <div
                       key={message.id}
                       className="flex gap-3 animate-fade-in"
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
                       
                       <div className="flex flex-col gap-1 max-w-[75%]">
                         {!isOwnMessage && (
                           <span className="text-xs text-white/60 px-1">{message.user_name}</span>
                         )}
                         
                         <div
                           className={`rounded-2xl px-4 py-2.5 relative group ${
                             isOwnMessage
                               ? "bg-gradient-to-r from-red-600 to-red-700 text-white"
                               : "bg-white/10 text-white border border-white/10"
                           }`}
                         >
                           {message.reply_to_sender && (
                             <div className="text-xs opacity-70 mb-1 pb-1 border-b border-white/20">
                               Antwort an {message.reply_to_sender}
                             </div>
                           )}
                           
                           <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                             {message.text}
                           </p>
                           
                           <span className="text-[10px] opacity-60 mt-1 block">
                             {formatTime(message.created_at)}
                           </span>
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
                 })}

                 <TypingIndicator typingUsers={typingUsers} />
                 <div ref={chatBottomRef} />

              </div>
            </div>
          </div>
        )}
      </div>

      {activeChatModeValue === 'community' && showScrollToBottom && (
        <button
          onClick={() => chatBottomRef?.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })}
          className="fixed right-4 bottom-28 z-20 rounded-full bg-black/60 backdrop-blur-xl border border-white/10 shadow-lg px-4 py-2 text-xs text-white hover:bg-black/80 transition-all duration-300"
          aria-label="Nach unten scrollen"
        >
          Zum Ende
        </button>
      )}

      {!hideInput && (
        <div className="sticky bottom-0 z-10 bg-background/80 backdrop-blur supports-[backdrop-filter]:backdrop-blur-sm border-t border-border">
          <div className="px-4 pt-2 pb-3">
            {activeChatModeValue === 'onboarding' && onboardingLogic.currentStep === 'city' && (
              <div className="mb-3 space-y-2">
                {onboardingLogic.filteredCities.length > 0 && onboardingLogic.citySearch && (
                  <div className="flex flex-wrap gap-2 mb-2">
                    {onboardingLogic.filteredCities.map((city) => (
                      <Button
                        key={city.abbr}
                        variant="outline"
                        size="sm"
                        onClick={() => onboardingLogic.selectCity(city.name)}
                        className="text-xs bg-white/5 hover:bg-white/10 border-white/20"
                      >
                        {city.name}
                      </Button>
                    ))}
                  </div>
                )}
              </div>
            )}
            
            {activeChatModeValue === 'onboarding' && ['name', 'city'].includes(onboardingLogic.currentStep) && (
              <div className="flex gap-2">
                {onboardingLogic.currentStep === 'city' ? (
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-white/40" />
                    <Input
                      value={onboardingLogic.citySearch}
                      onChange={(e) => onboardingLogic.setCitySearch(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          onboardingLogic.handleSendMessage();
                        }
                      }}
                      placeholder="Stadt eingeben..."
                      className="pl-10 bg-white/5 border-white/20 text-white placeholder:text-white/40"
                      autoFocus
                    />
                  </div>
                ) : (
                  <Input
                    value={onboardingLogic.inputMessage}
                    onChange={(e) => onboardingLogic.setInputMessage(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        onboardingLogic.handleSendMessage();
                      }
                    }}
                    placeholder="Deine Antwort..."
                    className="flex-1 bg-white/5 border-white/20 text-white placeholder:text-white/40"
                    autoFocus
                  />
                )}
                <Button
                  onClick={onboardingLogic.handleSendMessage}
                  disabled={onboardingLogic.currentStep === 'name' 
                    ? !onboardingLogic.inputMessage.trim() 
                    : !onboardingLogic.citySearch.trim()
                  }
                  className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800"
                >
                  →
                </Button>
              </div>
            )}
            
            {activeChatModeValue === 'ai' && (
              <RecentQueries
                showRecentQueries={showRecentQueries}
                setShowRecentQueries={setShowRecentQueries}
                queriesToRender={queriesToRender}
                handleExamplePromptClick={handleExamplePromptClick}
              />
            )}
            {activeChatModeValue === 'ai' && (
              <div className="flex justify-center">
                <ChatInput
                  input={currentInput}
                  setInput={currentSetInput}
                  handleSendMessage={currentHandleSendMessage}
                  isTyping={currentIsTyping}
                  onKeyDown={currentHandleKeyPress}
                  onChange={currentHandleInputChange}
                  isHeartActive={isHeartActive}
                  handleHeartClick={handleHeartClick}
                  globalQueries={globalQueries}
                  toggleRecentQueries={toggleRecentQueries}
                  inputRef={inputRef}
                  onAddEvent={onAddEvent}
                  showAnimatedPrompts={showAnimatedPrompts}
                  activeChatModeValue={activeChatModeValue}
                  activeCategory={activeCategory}
                  onCategoryChange={setActiveCategory}
                  onJoinEventChat={onJoinEventChat}
                  onCreatePoll={onCreatePoll}
                />
              </div>
            )}
              {activeChatModeValue === 'community' && (
                <div className="border-t border-red-500/10 bg-gradient-to-r from-red-950/20 to-black/40 backdrop-blur-xl p-4 pb-safe">
                  {replyTo && (
                    <div className="mb-3">
                      <ReplyPreview 
                        replyTo={replyTo} 
                        onCancel={clearReply}
                        groupType={activeCategory as 'ausgehen' | 'sport' | 'kreativität'}
                      />
                    </div>
                  )}
                  <MessageInput
                    username={username}
                    groupId={communityGroupId}
                    handleSendMessage={communitySendMessage}
                    isSending={communitySending}
                    value={communityInput}
                    onChange={(e) => setCommunityInput(e.target.value)}
                    mode="community"
                    replyTo={replyTo}
                    onClearReply={clearReply}
                  />
                </div>
              )}
          </div>
        </div>
      )}

      <UserProfileDialog
        open={showUserProfileDialog}
        onOpenChange={setShowUserProfileDialog}
        userProfile={selectedUserProfile}
        loading={loadingUserProfile}
      />
      
      {/* Hidden file input for onboarding avatar upload */}
      <input
        ref={onboardingLogic.fileInputRef}
        type="file"
        accept="image/*"
        onChange={onboardingLogic.handleImageUpload}
        className="hidden"
      />
    </div>
  );
};

export default FullPageChatBot;