// src/components/event-chat/FullPageChatBot.tsx
import React, { useEffect, useState, useMemo } from 'react';
import MessageList from './MessageList';
import ChatInput from './ChatInput';
import RecentQueries from './RecentQueries';
import { useChatMessages } from '@/hooks/chat/useChatMessages';

import { AVATAR_KEY, USERNAME_KEY, EventShare } from '@/types/chatTypes'; // Import EventShare
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getInitials } from '@/utils/chatUIUtils'; 
import TypingIndicator from '@/components/chat/TypingIndicator';
import ChatMessage from '@/components/chat/ChatMessage';
import MessageReactions from '@/components/chat/MessageReactions';
import { chatService } from '@/services/chatService';
import { useEventContext, cities } from '@/contexts/EventContext';
import { createGroupDisplayName } from '@/utils/groupIdUtils';
import { Button } from '@/components/ui/button';
import { getChannelColor } from '@/utils/channelColors';
import UserProfileDialog from '@/components/users/UserProfileDialog';
import { userService } from '@/services/userService';
import { UserProfile } from '@/types/chatTypes';
import { toast } from 'sonner';

interface FullPageChatBotProps {
  chatLogic: any;
  activeChatModeValue: 'ai' | 'community';
  communityGroupId: string;
  onAddEvent?: () => void;
  hideButtons?: boolean;
  activeCategory?: string;
  onCategoryChange?: (category: string) => void;
  onJoinEventChat?: (eventId: string, eventTitle: string) => void;
  hideInput?: boolean;
  externalInput?: string;
  setExternalInput?: (value: string) => void;
  onExternalSendHandlerChange?: (handler: ((input?: string | any) => Promise<void>) | null) => void; // Updated handler type
}

const FullPageChatBot: React.FC<FullPageChatBotProps> = ({
  chatLogic,
  activeChatModeValue,
  communityGroupId,
  onAddEvent,
  activeCategory: externalActiveCategory = 'Ausgehen',
  onCategoryChange: externalOnCategoryChange,
  onJoinEventChat,
  hideInput = false,
  externalInput = '',
  setExternalInput,
  onExternalSendHandlerChange
}) => {
  // Internal state for activeCategory with localStorage persistence
  const [internalActiveCategory, setInternalActiveCategory] = useState<string>(() => {
    // Load from localStorage on component mount
    try {
      const { getActiveCategory } = require('@/utils/chatPreferences');
      const result = getActiveCategory();
      console.log('FullPageChatBot: loading stored category =', result);
      return result;
    } catch (error) {
      console.error('FullPageChatBot: error loading category =', error);
      return 'Ausgehen';
    }
  });

  // Use external prop if provided, otherwise use internal state
  const activeCategory = externalActiveCategory !== 'Ausgehen' ? externalActiveCategory : internalActiveCategory;
  
  // Handle category changes
  const handleCategoryChange = (category: string) => {
    console.log('FullPageChatBot: changing category from', activeCategory, 'to', category);
    setInternalActiveCategory(category);
    
    // Save to localStorage
    try {
      const { saveActiveCategory } = require('@/utils/chatPreferences');
      saveActiveCategory(category);
    } catch (error) {
      console.error('FullPageChatBot: error saving category preference:', error);
    }
    
    // Call external handler if provided
    if (externalOnCategoryChange) {
      externalOnCategoryChange(category);
    }
  };
  
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

  const { selectedCity } = useEventContext();

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

  // Community chat state - managed externally via props
  const [communityInput, setCommunityInput] = useState('');
  const [communitySending, setCommunitySending] = useState(false);
  
  // Create send function directly instead of using external component
  const communitySendMessage = async () => {
    if (!communityInput.trim() || !username) return;
    
    try {
      setCommunitySending(true);
      
      // Format message with category label
      let messageText = communityInput.trim();
      const categoryLabel = `#${activeCategory.toLowerCase()}`;
      messageText = `${categoryLabel} ${messageText}`;
      
      // Clear input immediately
      setCommunityInput('');
      
      // Send directly to database via chatService
      await chatService.sendMessage(communityGroupId, messageText, username);
      
    } catch (error) {
      console.error('Error sending community message:', error);
      toast.error('Nachricht konnte nicht gesendet werden');
    } finally {
      setCommunitySending(false);
    }
  };

  // Filter state for community chat
  const [messageFilter, setMessageFilter] = useState<string[]>(['alle']);
  
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
    <div className="flex flex-col h-screen min-h-0">
      {/* Filter UI für Community Chat - immer sichtbar wenn Community-Modus */}
      {activeChatModeValue === 'community' && (
        <div className="sticky top-0 z-10 bg-background/80 backdrop-blur supports-[backdrop-filter]:backdrop-blur-sm border-b border-border">
          <div className="px-4 py-2">
            <div className="flex gap-2 overflow-x-auto scrollbar-none flex-nowrap">
              {['alle', 'ausgehen', 'kreativität', 'sport'].map((category) => {
                const isActive = messageFilter.includes(category);
                const isAll = category === 'alle';
                const chipBase = 'h-7 px-3 text-xs rounded-full transition-colors';
                if (isAll) {
                  return (
                    <Button
                      key={category}
                      variant="ghost"
                      size="sm"
                      className={`${chipBase} ${isActive ? 'bg-white/10 text-white border border-white/20' : 'text-muted-foreground hover:text-foreground hover:bg-muted/40'}`}
                      onClick={() => setMessageFilter(['alle'])}
                    >
                      #{category}
                    </Button>
                  );
                }
                const type = (category as 'ausgehen' | 'kreativität' | 'sport');
                const colors = getChannelColor(type);
                return (
                  <Button
                    key={category}
                    variant="ghost"
                    size="sm"
                    style={isActive ? { ...colors.bgStyle, ...colors.borderStyle, color: 'hsl(var(--foreground))' } : { ...colors.borderStyle, ...colors.textStyle }}
                    className={`${chipBase} border ${!isActive ? 'hover:bg-white/5' : ''}`}
                    onClick={() => {
                      setMessageFilter(prev => {
                        const newFilter = prev.filter(f => f !== 'alle');
                        if (newFilter.includes(category)) {
                          const result = newFilter.filter(f => f !== category);
                          return result.length === 0 ? ['alle'] : result;
                        } else {
                          return [...newFilter, category];
                        }
                      });
                    }}
                  >
                    #{category}
                  </Button>
                );
              })}
            </div>
          </div>
        </div>
      )}


      <div className="flex-1 min-h-0 overflow-y-auto scrollbar-none">
        {activeChatModeValue === 'ai' ? (
          <div className={hideInput ? "pt-4 px-3" : "pt-32 px-3"}> 
            <MessageList
              messages={aiMessages}
              isTyping={aiTyping}
              handleDateSelect={handleDateSelect}
              messagesEndRef={messagesEndRef}
              examplePrompts={examplePrompts}
              handleExamplePromptClick={handleExamplePromptClick}
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
              className="flex-1 min-h-0 overflow-y-auto scrollbar-none px-4"
            >
              <div className="space-y-2 py-4 pb-28">
                {filteredCommunityMessages.length === 0 && !communityLoading && !communityError && (
                  <div className="text-center text-gray-400 py-4">
                    {messageFilter.includes('alle') 
                      ? 'Noch keine Nachrichten im Community Chat. Starte die Unterhaltung!'
                      : `Keine Nachrichten in den gewählten Kategorien gefunden.`
                    }
                  </div>
                )}

                {filteredCommunityMessages.map((message, index) => {
                   const isConsecutive =
                     index > 0 && filteredCommunityMessages[index - 1].user_name === message.user_name;
                   const timeAgo = formatTime(message.created_at);

                   return (
                      <div key={message.id} className="mb-1 w-full group">
                        {!isConsecutive && (
                          <div className="flex items-center mb-1">
                             <Avatar 
                               className="h-7 w-7 mr-2 flex-shrink-0 ring-1 ring-border cursor-pointer hover:opacity-80 transition-opacity"
                               onClick={() => handleAvatarClick(message.user_name)}
                             >
                              <AvatarImage src={message.user_avatar} alt={message.user_name} />
                              <AvatarFallback className="bg-muted text-foreground">
                                {getInitials(message.user_name)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="text-base font-medium text-white mr-2">
                              {message.user_name}
                            </div>
                            <span className="text-sm text-muted-foreground">{timeAgo}</span>
                         </div>
                        )}
                        <div className="break-words">
                         <ChatMessage
                           message={message.text}
                           isConsecutive={isConsecutive}
                           isGroup
                           messageId={message.id}
                           reactions={message.reactions || []}
                           onReact={(emoji) => handleReaction(message.id, emoji)}
                           currentUsername={username}
                         />
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
          className="fixed right-4 bottom-28 z-20 rounded-full bg-background/80 backdrop-blur supports-[backdrop-filter]:backdrop-blur-md border border-border shadow-md px-3 py-2 text-xs text-foreground hover:bg-muted transition"
          aria-label="Nach unten scrollen"
        >
          Zum Ende
        </button>
      )}

      {!hideInput && (
        <div className="sticky bottom-0 z-10 bg-background/80 backdrop-blur supports-[backdrop-filter]:backdrop-blur-sm border-t border-border">
          <div className="px-4 pt-2 pb-3">
            {activeChatModeValue === 'ai' && (
              <RecentQueries
                showRecentQueries={showRecentQueries}
                setShowRecentQueries={setShowRecentQueries}
                queriesToRender={queriesToRender}
                handleExamplePromptClick={handleExamplePromptClick}
              />
            )}
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
                onCategoryChange={handleCategoryChange}
                onJoinEventChat={onJoinEventChat}
              />
            </div>
          </div>
        </div>
      )}

      <UserProfileDialog
        open={showUserProfileDialog}
        onOpenChange={setShowUserProfileDialog}
        userProfile={selectedUserProfile}
        loading={loadingUserProfile}
      />
    </div>
  );
};

export default FullPageChatBot;