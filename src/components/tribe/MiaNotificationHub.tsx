import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, MessageCircle, ArrowUp } from 'lucide-react';
import { useMiaNotifications } from '@/hooks/useMiaNotifications';
import { MiaNotification } from '@/services/miaNotificationService';
import { Badge } from '@/components/ui/badge';
import { usePersonalizedSuggestions } from '@/hooks/usePersonalizedSuggestions';
import { getTribeResponse } from '@/services/tribe/aiHelpers';
import { TribeEvent } from '@/types/tribe';

const MIA_AVATAR = "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150&h=150";

interface MiaNotificationHubProps {
  username: string;
  interests?: string[];
  hobbies?: string[];
  favorite_locations?: string[];
  city?: string;
  likedEventIds?: string[];
  attendingEventIds?: string[];
  events?: TribeEvent[];
  onViewEvent?: (eventId: string) => void;
  onViewProfile?: (username: string) => void;
  onOpenChat?: () => void;
  onJoinCommunityChat?: () => void;
}

// Chat message type for hub chat
interface HubChatMessage {
  role: 'user' | 'model';
  text: string;
  relatedEvents?: TribeEvent[];
}

export const MiaNotificationHub: React.FC<MiaNotificationHubProps> = ({
  username,
  interests,
  hobbies,
  favorite_locations,
  city,
  likedEventIds,
  attendingEventIds,
  events = [],
  onViewEvent,
  onViewProfile,
  onOpenChat,
  onJoinCommunityChat,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'notifications' | 'chat'>('notifications');
  const { notifications, unreadCount, markAllSeen, markSeen } = useMiaNotifications({
    username, interests, hobbies, favorite_locations, city, likedEventIds, attendingEventIds,
  });

  // Chat state
  const [chatMessages, setChatMessages] = useState<HubChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Personalized suggestions
  const suggestions = usePersonalizedSuggestions(
    { username, interests, favorite_locations, hobbies },
    city
  );

  const handleOpen = () => {
    setIsOpen(true);
    if (unreadCount > 0) {
      setActiveTab('notifications');
    }
    markAllSeen();
  };

  const handleOpenChat = () => {
    setIsOpen(true);
    setActiveTab('chat');
    setTimeout(() => inputRef.current?.focus(), 300);
  };

  const handleAction = (notification: MiaNotification) => {
    markSeen(notification.id);
    switch (notification.actionType) {
      case 'view_event':
        onViewEvent?.(notification.actionPayload || '');
        setIsOpen(false);
        break;
      case 'view_profile':
        onViewProfile?.(notification.actionPayload || '');
        setIsOpen(false);
        break;
      case 'chat_mia':
        setActiveTab('chat');
        setTimeout(() => inputRef.current?.focus(), 100);
        break;
      case 'join_community_chat':
        onJoinCommunityChat?.();
        setIsOpen(false);
        break;
      default:
        break;
    }
  };

  const handleSendMessage = async (text?: string) => {
    const messageText = text || chatInput.trim();
    if (!messageText) return;

    setChatInput('');
    setChatMessages(prev => [...prev, { role: 'user', text: messageText }]);
    setIsTyping(true);

    try {
      const response = await getTribeResponse(
        messageText,
        events,
        { username, interests, favorite_locations, hobbies },
        city
      );

      setChatMessages(prev => [...prev, {
        role: 'model',
        text: response.text.replace(/\*\*/g, '').replace(/\*/g, ''),
        relatedEvents: response.relatedEvents,
      }]);
    } catch {
      setChatMessages(prev => [...prev, {
        role: 'model',
        text: 'Entschuldigung, da ist etwas schiefgelaufen. Versuch es nochmal!',
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, isTyping]);

  return (
    <>
      {/* FAB Button */}
      <motion.button
        onClick={handleOpen}
        className="fixed bottom-20 right-4 z-[60] w-14 h-14 rounded-full overflow-hidden border-2 border-gold shadow-lg"
        whileTap={{ scale: 0.9 }}
        style={{
          boxShadow: unreadCount > 0
            ? '0 0 20px rgba(209,176,122,0.5), 0 0 40px rgba(209,176,122,0.2)'
            : '0 4px 12px rgba(0,0,0,0.4)',
        }}
      >
        <img src={MIA_AVATAR} alt="MIA" className="w-full h-full object-cover" />
        {unreadCount > 0 && (
          <div className="absolute inset-0 rounded-full border-2 border-gold animate-ping opacity-40" />
        )}
        {unreadCount > 0 && (
          <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-[10px] font-bold text-white border-2 border-black">
            {unreadCount > 9 ? '9+' : unreadCount}
          </div>
        )}
      </motion.button>

      {/* Panel */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[70] bg-black/60 backdrop-blur-sm"
              onClick={() => setIsOpen(false)}
            />

            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed inset-x-0 bottom-0 z-[80] max-h-[85vh] bg-zinc-950 border-t border-white/10 rounded-t-2xl overflow-hidden flex flex-col"
            >
              {/* Handle */}
              <div className="flex justify-center pt-3 pb-1">
                <div className="w-10 h-1 rounded-full bg-white/20" />
              </div>

              {/* Header + Tabs */}
              <div className="px-4 pb-2">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <img src={MIA_AVATAR} alt="MIA" className="w-8 h-8 rounded-full border border-gold" />
                    <div>
                      <h3 className="text-sm font-semibold text-white flex items-center gap-1">
                        MIA <Sparkles size={12} className="text-gold" />
                      </h3>
                      <p className="text-[10px] text-zinc-500 uppercase tracking-wider">Deine Community-Assistentin</p>
                    </div>
                  </div>
                  <button onClick={() => setIsOpen(false)} className="text-zinc-500 hover:text-white p-1">
                    <X size={18} />
                  </button>
                </div>

                {/* Tab Switcher */}
                <div className="flex gap-1 bg-zinc-900 rounded-lg p-1">
                  <button
                    onClick={() => setActiveTab('notifications')}
                    className={`flex-1 py-1.5 rounded-md text-xs font-medium transition-colors flex items-center justify-center gap-1.5 ${
                      activeTab === 'notifications'
                        ? 'bg-zinc-800 text-white'
                        : 'text-zinc-500 hover:text-zinc-300'
                    }`}
                  >
                    <Sparkles size={12} />
                    Updates
                    {unreadCount > 0 && (
                      <span className="w-4 h-4 bg-red-500 rounded-full text-[9px] flex items-center justify-center text-white font-bold">
                        {unreadCount}
                      </span>
                    )}
                  </button>
                  <button
                    onClick={() => {
                      setActiveTab('chat');
                      setTimeout(() => inputRef.current?.focus(), 100);
                    }}
                    className={`flex-1 py-1.5 rounded-md text-xs font-medium transition-colors flex items-center justify-center gap-1.5 ${
                      activeTab === 'chat'
                        ? 'bg-zinc-800 text-white'
                        : 'text-zinc-500 hover:text-zinc-300'
                    }`}
                  >
                    <MessageCircle size={12} />
                    Chat mit MIA
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto scrollbar-none">
                {activeTab === 'notifications' ? (
                  /* Notification List */
                  <div className="px-4 pb-4 space-y-3">
                    {notifications.length === 0 ? (
                      <div className="text-center py-8">
                        <p className="text-zinc-500 text-sm">Alles ruhig gerade 😌</p>
                        <p className="text-zinc-600 text-xs mt-1">Ich melde mich, wenn was los ist!</p>
                        <button
                          onClick={() => {
                            setActiveTab('chat');
                            setTimeout(() => inputRef.current?.focus(), 100);
                          }}
                          className="mt-4 text-gold text-xs font-medium hover:text-gold/80 transition-colors"
                        >
                          Frag mich was! →
                        </button>
                      </div>
                    ) : (
                      notifications.map((notification) => (
                        <NotificationCard
                          key={notification.id}
                          notification={notification}
                          onAction={handleAction}
                          onMarkSeen={markSeen}
                          onViewEvent={onViewEvent}
                          onJoinCommunityChat={onJoinCommunityChat}
                          onClose={() => setIsOpen(false)}
                        />
                      ))
                    )}
                  </div>
                ) : (
                  /* Chat View */
                  <div className="px-4 pb-4 flex flex-col min-h-[300px]">
                    {chatMessages.length === 0 ? (
                      /* Empty state with suggestions */
                      <div className="space-y-4 py-4">
                        <p className="text-sm text-zinc-400 text-center">
                          Hey {username}! Was möchtest du wissen? 🎯
                        </p>
                        <div className="flex flex-wrap gap-2 justify-center">
                          {suggestions.slice(0, 5).map((suggestion, i) => (
                            <button
                              key={i}
                              onClick={() => handleSendMessage(suggestion)}
                              className="px-3 py-1.5 bg-zinc-900 border border-white/10 rounded-full text-xs text-zinc-300 hover:border-gold/30 hover:text-white transition-colors"
                            >
                              {suggestion}
                            </button>
                          ))}
                        </div>
                      </div>
                    ) : (
                      /* Chat messages */
                      <div className="space-y-3 py-2">
                        {chatMessages.map((msg, i) => (
                          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            {msg.role === 'model' && (
                              <img src={MIA_AVATAR} alt="MIA" className="w-6 h-6 rounded-full mr-2 mt-1 shrink-0" />
                            )}
                            <div className={`max-w-[85%] ${
                              msg.role === 'user'
                                ? 'bg-gold/20 border border-gold/30 rounded-2xl rounded-br-sm px-3 py-2'
                                : 'bg-zinc-900 border border-white/5 rounded-2xl rounded-bl-sm px-3 py-2'
                            }`}>
                              <p className="text-sm text-white/90 leading-relaxed">{msg.text}</p>
                              {/* Event chips */}
                              {msg.relatedEvents && msg.relatedEvents.length > 0 && (
                                <div className="flex flex-wrap gap-1.5 mt-2 pt-2 border-t border-white/5">
                                  {msg.relatedEvents.slice(0, 3).map(event => (
                                    <button
                                      key={event.id}
                                      onClick={() => { onViewEvent?.(event.id); setIsOpen(false); }}
                                      className="text-[10px] px-2 py-1 bg-gold/10 border border-gold/20 rounded-full text-gold hover:bg-gold/20 transition-colors"
                                    >
                                      {event.title?.slice(0, 30)}{(event.title?.length || 0) > 30 ? '…' : ''}
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                        {isTyping && (
                          <div className="flex justify-start">
                            <img src={MIA_AVATAR} alt="MIA" className="w-6 h-6 rounded-full mr-2 mt-1 shrink-0" />
                            <div className="bg-zinc-900 border border-white/5 rounded-2xl rounded-bl-sm px-3 py-2">
                              <div className="flex gap-1">
                                <span className="w-2 h-2 bg-gold rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                <span className="w-2 h-2 bg-gold rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                <span className="w-2 h-2 bg-gold rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                              </div>
                            </div>
                          </div>
                        )}
                        <div ref={chatEndRef} />
                      </div>
                    )}
                  </div>
                )}
              </div>


              {/* Chat input — visible in BOTH tabs */}
              <div className="p-3 border-t border-white/5">
                {/* Quick suggestions */}
                {(activeTab === 'notifications' || chatMessages.length > 0) && (
                  <div className="flex gap-1.5 overflow-x-auto scrollbar-none mb-2 pb-1">
                    {suggestions.slice(0, activeTab === 'notifications' ? 4 : 3).map((s, i) => (
                      <button
                        key={i}
                        onClick={() => { setActiveTab('chat'); handleSendMessage(s); }}
                        className="shrink-0 px-2.5 py-1 bg-zinc-900 border border-white/10 rounded-full text-[10px] text-zinc-400 hover:text-white hover:border-gold/30 transition-colors"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <input
                    ref={inputRef}
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        if (activeTab === 'notifications') setActiveTab('chat');
                        handleSendMessage();
                      }
                    }}
                    onFocus={() => { if (activeTab === 'notifications') setActiveTab('chat'); }}
                    placeholder="Frag MIA was..."
                    className="flex-1 bg-zinc-900 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder-zinc-600 outline-none focus:border-gold/30 transition-colors"
                  />
                  <button
                    onClick={() => {
                      if (activeTab === 'notifications') setActiveTab('chat');
                      handleSendMessage();
                    }}
                    disabled={!chatInput.trim() || isTyping}
                    className="w-8 h-8 flex items-center justify-center bg-gold/20 border border-gold/30 rounded-lg text-gold hover:bg-gold/30 transition-colors disabled:opacity-30"
                  >
                    <ArrowUp size={16} />
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

// Extracted notification card component
const NotificationCard: React.FC<{
  notification: MiaNotification;
  onAction: (n: MiaNotification) => void;
  onMarkSeen: (id: string) => void;
  onViewEvent?: (eventId: string) => void;
  onJoinCommunityChat?: () => void;
  onClose: () => void;
}> = ({ notification, onAction, onMarkSeen, onViewEvent, onJoinCommunityChat, onClose }) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    className={`p-3 rounded-xl border transition-colors flex gap-3 ${
      notification.seen
        ? 'bg-zinc-900/50 border-white/5'
        : notification.type === 'community_match'
          ? 'bg-zinc-900 border-gold/30'
          : 'bg-zinc-900 border-gold/20'
    }`}
  >
    {/* Avatar(s) */}
    {notification.type === 'community_match' && notification.matchAvatars && notification.matchAvatars.length > 0 ? (
      <div className="shrink-0 mt-0.5 flex items-center">
        <div className="flex -space-x-2">
          {notification.matchAvatars.slice(0, 3).map((avatar, i) => (
            <img key={i} src={avatar} alt="" className="w-8 h-8 rounded-full object-cover border-2 border-zinc-950" />
          ))}
          {(notification.matchCount || 0) > 3 && (
            <div className="w-8 h-8 rounded-full bg-zinc-800 border-2 border-zinc-950 flex items-center justify-center text-[10px] font-bold text-gold">
              +{(notification.matchCount || 0) - 3}
            </div>
          )}
        </div>
      </div>
    ) : notification.avatarUrl ? (
      <img src={notification.avatarUrl} alt="" className="w-9 h-9 rounded-full object-cover border border-white/10 shrink-0 mt-0.5" />
    ) : (
      <div className="w-9 h-9 rounded-full bg-zinc-800 border border-white/10 shrink-0 mt-0.5 flex items-center justify-center">
        <Sparkles size={14} className="text-gold" />
      </div>
    )}
    <div className="flex-1 min-w-0">
      {notification.type === 'community_match' && (
        <Badge className="bg-gold/20 text-gold border-gold/30 text-[10px] mb-1">
          {(notification.matchCount || 0) + 1} Leute · Community Match
        </Badge>
      )}
      <p className="text-sm text-white/90 leading-relaxed">{notification.text}</p>
      <div className="flex gap-3 mt-2">
        {notification.actionLabel && (
          <button
            onClick={() => onAction(notification)}
            className="text-xs font-medium text-gold hover:text-gold/80 transition-colors"
          >
            {notification.actionLabel} →
          </button>
        )}
        {notification.secondaryActionLabel && (
          <button
            onClick={() => {
              onMarkSeen(notification.id);
              if (notification.secondaryActionType === 'join_community_chat') {
                onJoinCommunityChat?.();
              } else if (notification.secondaryActionType === 'view_event') {
                onViewEvent?.(notification.secondaryActionPayload || '');
              }
              onClose();
            }}
            className="text-xs font-medium text-zinc-400 hover:text-white transition-colors"
          >
            {notification.secondaryActionLabel} →
          </button>
        )}
      </div>
    </div>
  </motion.div>
);
