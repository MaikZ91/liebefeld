import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, ArrowUp, Star, Users } from 'lucide-react';
import { useMiaNotifications } from '@/hooks/useMiaNotifications';
import { MiaNotification } from '@/services/miaNotificationService';
import { Badge } from '@/components/ui/badge';
import { usePersonalizedSuggestions } from '@/hooks/usePersonalizedSuggestions';
import { getTribeResponse } from '@/services/tribe/aiHelpers';
import { TribeEvent } from '@/types/tribe';
import { MiaEventCard } from './MiaEventCard';
import { supabase } from '@/integrations/supabase/client';

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
  
  const { notifications, unreadCount, markAllSeen, markSeen } = useMiaNotifications({
    username, interests, hobbies, favorite_locations, city, likedEventIds, attendingEventIds,
  });

  const [chatMessages, setChatMessages] = useState<HubChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [typewriterText, setTypewriterText] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Active users (recently online)
  const [activeUsers, setActiveUsers] = useState<Array<{ username: string; avatar: string | null }>>([]);
  
  useEffect(() => {
    if (!isOpen) return;
    const loadActiveUsers = async () => {
      try {
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        
        // Get all distinct usernames active today from activity logs
        const { data: logData } = await supabase
          .from('user_activity_logs')
          .select('username')
          .gte('created_at', todayStart.toISOString());
        
        const uniqueUsernames = [...new Set((logData || []).map(l => l.username))]
          .filter(u => !u.startsWith('Guest_') && u !== username);
        
        if (uniqueUsernames.length > 0) {
          const { data: profiles } = await supabase
            .from('user_profiles')
            .select('username, avatar')
            .in('username', uniqueUsernames);
          
          if (profiles) {
            setActiveUsers(profiles.filter(u => !u.username.startsWith('Guest_')).slice(0, 12));
          }
        } else {
          setActiveUsers([]);
        }
      } catch (err) {
        console.error('Error loading active users:', err);
      }
    };
    loadActiveUsers();
  }, [isOpen, username]);

  const suggestions = usePersonalizedSuggestions(
    { username, interests, favorite_locations, hobbies },
    city
  );

  // Daily recommendations (dismissable, once per day)
  const [dailyDismissed, setDailyDismissed] = useState(() => {
    const stored = localStorage.getItem('mia_daily_dismissed');
    return stored === new Date().toISOString().split('T')[0];
  });

  const dailyRecommendations = React.useMemo(() => {
    if (dailyDismissed) return [];
    const today = new Date().toISOString().split('T')[0];
    return events
      .filter(e => e.date >= today)
      .sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0))
      .slice(0, 3);
  }, [events, dailyDismissed]);

  const dismissDaily = () => {
    const today = new Date().toISOString().split('T')[0];
    localStorage.setItem('mia_daily_dismissed', today);
    setDailyDismissed(true);
  };

  const handleOpen = () => {
    setIsOpen(true);
    markAllSeen();
  };

  const handleOpenChat = () => {
    setIsOpen(true);
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

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, isTyping]);

  // Typewriter effect for input placeholder
  useEffect(() => {
    if (isFocused || chatInput) return; // Stop when user is typing
    
    let currentSuggestionIndex = 0;
    let charIndex = 0;
    let isDeleting = false;
    let pauseTimeout: NodeJS.Timeout;
    
    const tick = () => {
      const currentText = suggestions[currentSuggestionIndex % suggestions.length] || '';
      
      if (!isDeleting) {
        charIndex++;
        setTypewriterText(currentText.slice(0, charIndex));
        
        if (charIndex >= currentText.length) {
          // Pause 3s before deleting
          pauseTimeout = setTimeout(() => { isDeleting = true; tick(); }, 3000);
          return;
        }
        pauseTimeout = setTimeout(tick, 60 + Math.random() * 40);
      } else {
        charIndex--;
        setTypewriterText(currentText.slice(0, charIndex));
        
        if (charIndex <= 0) {
          isDeleting = false;
          currentSuggestionIndex++;
          // Small pause before next prompt
          pauseTimeout = setTimeout(tick, 500);
          return;
        }
        pauseTimeout = setTimeout(tick, 30);
      }
    };
    
    pauseTimeout = setTimeout(tick, 1000);
    return () => clearTimeout(pauseTimeout);
  }, [isFocused, chatInput, suggestions]);

  return (
    <>
      {/* FAB Button */}
      <motion.button
        onClick={handleOpen}
        className="fixed bottom-20 right-4 z-[60] w-14 h-14 rounded-full overflow-hidden shadow-2xl"
        whileTap={{ scale: 0.9 }}
        style={{
          boxShadow: unreadCount > 0
            ? '0 0 24px rgba(255,255,255,0.2), 0 0 48px rgba(255,255,255,0.05)'
            : '0 8px 32px rgba(0,0,0,0.6)',
          border: '2px solid rgba(255,255,255,0.25)',
        }}
      >
        <img src={MIA_AVATAR} alt="MIA" className="w-full h-full object-cover" />
        {unreadCount > 0 && (
           <motion.div
             className="absolute inset-0 rounded-full"
             style={{ border: '2px solid rgba(255,255,255,0.3)' }}
             animate={{ scale: [1, 1.3, 1], opacity: [0.6, 0, 0.6] }}
             transition={{ duration: 2, repeat: Infinity }}
          />
        )}
        {unreadCount > 0 && (
           <div className="absolute -top-1 -right-1 w-5 h-5 bg-white rounded-full flex items-center justify-center text-[10px] font-bold text-black shadow-lg">
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
              className="fixed inset-0 z-[70] bg-black/70 backdrop-blur-md"
              onClick={() => setIsOpen(false)}
            />

            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 320 }}
              className="fixed inset-x-0 bottom-0 z-[80] max-h-[85vh] rounded-t-3xl overflow-hidden flex flex-col"
              style={{
                background: '#000',
                borderTop: '1px solid rgba(255,255,255,0.1)',
              }}
            >
              {/* Handle */}
              <div className="flex justify-center pt-3 pb-1">
                <div className="w-10 h-1 rounded-full bg-white/15" />
              </div>

              {/* Header */}
              <div className="px-5 pb-3">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                     <img src={MIA_AVATAR} alt="MIA" className="w-9 h-9 rounded-full object-cover" style={{ border: '1.5px solid rgba(255,255,255,0.2)' }} />
                     <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-white border-2 border-black" />
                    </div>
                    <div>
                      <h3 className="text-sm font-light tracking-[0.15em] text-white/90 uppercase" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
                        MIA
                      </h3>
                      <p className="text-[10px] text-white/30 tracking-wider">Community-Assistentin</p>
                    </div>
                  </div>
                  <button onClick={() => setIsOpen(false)} className="w-7 h-7 flex items-center justify-center rounded-full bg-white/5 text-white/40 hover:text-white/80 hover:bg-white/10 transition-all">
                    <X size={14} />
                  </button>
                </div>

                {/* Active Users Widget */}
                {activeUsers.length > 0 && (
                  <div className="mt-1 p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-1.5">
                        <Users size={10} className="text-white/40" />
                        <span className="text-[9px] text-white/40 uppercase tracking-[0.15em] font-medium">Heute aktiv</span>
                      </div>
                      <span className="text-[9px] text-white/25">{activeUsers.length} dabei</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex -space-x-2">
                        {activeUsers.slice(0, 5).map((user, i) => (
                          <div
                            key={user.username}
                            className="relative"
                            title={user.username}
                          >
                            {user.avatar ? (
                              <img src={user.avatar} alt={user.username} className="w-7 h-7 rounded-full object-cover border-2 border-black hover:scale-110 transition-transform" />
                            ) : (
                              <div className="w-7 h-7 rounded-full bg-white/10 border-2 border-black flex items-center justify-center text-[9px] font-bold text-white/60 hover:scale-110 transition-transform">
                                {user.username[0]?.toUpperCase()}
                              </div>
                            )}
                          </div>
                        ))}
                        {activeUsers.length > 5 && (
                          <div className="w-7 h-7 rounded-full bg-white/[0.06] border-2 border-black flex items-center justify-center text-[8px] font-bold text-white/40">
                            +{activeUsers.length - 5}
                          </div>
                        )}
                      </div>
                      <button
                        onClick={() => { onJoinCommunityChat?.(); setIsOpen(false); }}
                        className="text-[10px] text-white/40 hover:text-white/70 font-medium ml-1 transition-colors"
                      >
                        Im Chat connecten →
                      </button>
                    </div>
                  </div>
                )}

              </div>

              {/* Unified Content — Updates + Chat in one stream */}
              <div className="flex-1 overflow-y-auto scrollbar-none">
                <div className="px-5 pb-4 space-y-3">
                  {/* Daily Recommendations */}
                  {dailyRecommendations.length > 0 && (
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Star size={12} className="text-white/50" />
                          <h4 className="text-[10px] font-medium text-white/50 uppercase tracking-[0.2em]">Deine Tagesempfehlung</h4>
                        </div>
                        <button onClick={dismissDaily} className="text-white/20 hover:text-white/50 transition-colors">
                          <X size={12} />
                        </button>
                      </div>
                      <div className="space-y-1.5">
                        {dailyRecommendations.map(event => (
                          <MiaEventCard
                            key={event.id}
                            event={event}
                            onView={(id) => { onViewEvent?.(id); setIsOpen(false); }}
                            showMatchScore
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Notifications */}
                  {notifications.length > 0 && (
                    <>
                      {dailyRecommendations.length > 0 && (
                        <div className="flex items-center gap-2 pt-1 pb-1">
                          <div className="flex-1 h-px bg-white/[0.06]" />
                          <span className="text-[9px] text-white/25 uppercase tracking-[0.2em]">Updates</span>
                          <div className="flex-1 h-px bg-white/[0.06]" />
                        </div>
                      )}
                      {notifications.map((notification) => (
                        <NotificationCard
                          key={notification.id}
                          notification={notification}
                          onAction={handleAction}
                          onMarkSeen={markSeen}
                          onViewEvent={onViewEvent}
                          onJoinCommunityChat={onJoinCommunityChat}
                          onClose={() => setIsOpen(false)}
                        />
                      ))}
                    </>
                  )}

                  {/* Divider before chat */}
                  {(dailyRecommendations.length > 0 || notifications.length > 0) && (
                    <div className="flex items-center gap-2 pt-1 pb-1">
                      <div className="flex-1 h-px bg-white/[0.06]" />
                      <span className="text-[9px] text-white/25 uppercase tracking-[0.2em]">Chat</span>
                      <div className="flex-1 h-px bg-white/[0.06]" />
                    </div>
                  )}

                  {/* Chat Messages */}
                  {chatMessages.length === 0 ? (
                    <div className="space-y-4 py-4 flex flex-col items-center">
                      <p className="text-xs text-white/30 font-light">Frag mich was du wissen möchtest ↓</p>
                      <div className="flex flex-wrap gap-2 justify-center max-w-[280px]">
                        {suggestions.slice(0, 5).map((suggestion, i) => (
                          <button
                            key={i}
                            onClick={() => handleSendMessage(suggestion)}
                            className="px-3 py-1.5 bg-white/[0.04] border border-white/[0.06] rounded-full text-[11px] text-white/50 hover:border-white/20 hover:text-white/80 hover:bg-white/[0.06] transition-all"
                          >
                            {suggestion}
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3 py-2">
                      {chatMessages.map((msg, i) => (
                        <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                          {msg.role === 'model' && (
                            <img src={MIA_AVATAR} alt="MIA" className="w-6 h-6 rounded-full mr-2 mt-1 shrink-0 object-cover" style={{ border: '1px solid rgba(255,255,255,0.15)' }} />
                          )}
                          <div className={`max-w-[85%] ${
                            msg.role === 'user'
                              ? 'bg-white/10 border border-white/15 rounded-2xl rounded-br-sm px-3.5 py-2.5'
                              : 'bg-white/[0.04] border border-white/[0.05] rounded-2xl rounded-bl-sm px-3.5 py-2.5'
                          }`}>
                            <p className="text-[13px] text-white/85 leading-relaxed font-light">{msg.text}</p>
                            {msg.relatedEvents && msg.relatedEvents.length > 0 && (
                              <div className="mt-2.5 pt-2.5 border-t border-white/[0.05] space-y-1.5">
                                {msg.relatedEvents.slice(0, 3).map(event => (
                                  <MiaEventCard
                                    key={event.id}
                                    event={event}
                                    onView={(id) => { onViewEvent?.(id); setIsOpen(false); }}
                                  />
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                      {isTyping && (
                        <div className="flex justify-start">
                          <img src={MIA_AVATAR} alt="MIA" className="w-6 h-6 rounded-full mr-2 mt-1 shrink-0 object-cover" style={{ border: '1px solid rgba(255,255,255,0.15)' }} />
                          <div className="bg-white/[0.04] border border-white/[0.05] rounded-2xl rounded-bl-sm px-4 py-3">
                            <div className="flex gap-1.5">
                              <span className="w-1.5 h-1.5 bg-white/40 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                              <span className="w-1.5 h-1.5 bg-white/40 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                              <span className="w-1.5 h-1.5 bg-white/40 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                            </div>
                          </div>
                        </div>
                      )}
                      <div ref={chatEndRef} />
                    </div>
                  )}
                </div>
              </div>

              {/* Chat input */}
              <div className="p-4 pt-2" style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                {chatMessages.length > 0 && (
                  <div className="flex gap-1.5 overflow-x-auto scrollbar-none mb-2.5 pb-0.5">
                    {suggestions.slice(0, 3).map((s, i) => (
                      <button
                        key={i}
                        onClick={() => handleSendMessage(s)}
                        className="shrink-0 px-2.5 py-1 bg-white/[0.03] border border-white/[0.06] rounded-full text-[10px] text-white/35 hover:text-white/70 hover:border-white/15 transition-all"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                )}
                <div className="flex items-center gap-2 relative">
                  <div className="flex-1 relative">
                    <input
                      ref={inputRef}
                      type="text"
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      onFocus={() => setIsFocused(true)}
                      onBlur={() => setIsFocused(false)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSendMessage();
                      }}
                      placeholder=""
                      className="flex-1 w-full bg-white/[0.04] border border-white/[0.06] rounded-xl px-4 py-2.5 text-sm text-white/90 outline-none focus:border-white/20 transition-all font-light"
                    />
                    {!chatInput && !isFocused && (
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-white/25 font-light pointer-events-none">
                        {typewriterText}<span className="animate-pulse ml-0.5 text-white/30">|</span>
                      </span>
                    )}
                    {!chatInput && isFocused && (
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-white/20 font-light pointer-events-none">
                        Frag MIA was...
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => handleSendMessage()}
                    disabled={!chatInput.trim() || isTyping}
                    className="w-8 h-8 flex items-center justify-center rounded-lg transition-all disabled:opacity-30"
                    style={{
                      background: '#FFFFFF',
                      color: '#000000',
                      isolation: 'isolate',
                    }}
                  >
                    <ArrowUp size={14} strokeWidth={2.5} />
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

// Notification card component
const NotificationCard: React.FC<{
  notification: MiaNotification;
  onAction: (n: MiaNotification) => void;
  onMarkSeen: (id: string) => void;
  onViewEvent?: (eventId: string) => void;
  onJoinCommunityChat?: () => void;
  onClose: () => void;
}> = ({ notification, onAction, onMarkSeen, onViewEvent, onJoinCommunityChat, onClose }) => (
  <motion.div
    initial={{ opacity: 0, y: 8 }}
    animate={{ opacity: 1, y: 0 }}
    className={`p-3.5 rounded-xl transition-all flex gap-3 ${
      notification.seen
        ? 'bg-white/[0.02] border border-white/[0.04]'
        : notification.type === 'community_match'
          ? 'bg-white/[0.06] border border-white/15'
          : 'bg-white/[0.04] border border-white/10'
    }`}
  >
    {/* Avatar(s) */}
    {notification.type === 'community_match' && notification.matchAvatars && notification.matchAvatars.length > 0 ? (
      <div className="shrink-0 mt-0.5 flex items-center">
        <div className="flex -space-x-2">
          {notification.matchAvatars.slice(0, 3).map((avatar, i) => (
            <img key={i} src={avatar} alt="" className="w-8 h-8 rounded-full object-cover border-2 border-black" />
          ))}
          {(notification.matchCount || 0) > 3 && (
            <div className="w-8 h-8 rounded-full bg-white/[0.06] border-2 border-black flex items-center justify-center text-[10px] font-bold text-white/60">
              +{(notification.matchCount || 0) - 3}
            </div>
          )}
        </div>
      </div>
    ) : notification.avatarUrl ? (
      <img src={notification.avatarUrl} alt="" className="w-9 h-9 rounded-full object-cover border border-white/[0.08] shrink-0 mt-0.5" />
    ) : (
      <div className="w-9 h-9 rounded-full bg-white/[0.04] border border-white/[0.06] shrink-0 mt-0.5 flex items-center justify-center">
        <Sparkles size={13} className="text-white/40" />
      </div>
    )}
    <div className="flex-1 min-w-0">
      {notification.type === 'community_match' && (
        <Badge className="bg-white/10 text-white/70 border-white/15 text-[9px] mb-1.5 font-medium tracking-wide">
          {(notification.matchCount || 0) + 1} Leute · Match
        </Badge>
      )}
      <p className="text-[13px] text-white/80 leading-relaxed font-light">{notification.text}</p>
      <div className="flex gap-3 mt-2">
        {notification.actionLabel && (
          <button
            onClick={() => onAction(notification)}
            className="text-[11px] font-medium text-white/60 hover:text-white transition-colors tracking-wide"
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
            className="text-[11px] font-medium text-white/30 hover:text-white/60 transition-colors"
          >
            {notification.secondaryActionLabel} →
          </button>
        )}
      </div>
    </div>
  </motion.div>
);
