import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, MessageCircle } from 'lucide-react';
import { useMiaNotifications } from '@/hooks/useMiaNotifications';
import { MiaNotification } from '@/services/miaNotificationService';
import { Badge } from '@/components/ui/badge';

const MIA_AVATAR = "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150&h=150";

interface MiaNotificationHubProps {
  username: string;
  interests?: string[];
  hobbies?: string[];
  favorite_locations?: string[];
  city?: string;
  likedEventIds?: string[];
  attendingEventIds?: string[];
  onViewEvent?: (eventId: string) => void;
  onViewProfile?: (username: string) => void;
  onOpenChat?: () => void;
}

export const MiaNotificationHub: React.FC<MiaNotificationHubProps> = ({
  username,
  interests,
  hobbies,
  favorite_locations,
  city,
  likedEventIds,
  attendingEventIds,
  onViewEvent,
  onViewProfile,
  onOpenChat,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const { notifications, unreadCount, markAllSeen, markSeen } = useMiaNotifications({
    username, interests, hobbies, favorite_locations, city, likedEventIds, attendingEventIds,
  });

  const handleOpen = () => {
    setIsOpen(true);
    markAllSeen();
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
        onOpenChat?.();
        setIsOpen(false);
        break;
      default:
        break;
    }
  };

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

        {/* Pulse ring when unread */}
        {unreadCount > 0 && (
          <div className="absolute inset-0 rounded-full border-2 border-gold animate-ping opacity-40" />
        )}

        {/* Badge */}
        {unreadCount > 0 && (
          <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-[10px] font-bold text-white border-2 border-black">
            {unreadCount > 9 ? '9+' : unreadCount}
          </div>
        )}
      </motion.button>

      {/* Notification Panel */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[70] bg-black/60 backdrop-blur-sm"
              onClick={() => setIsOpen(false)}
            />

            {/* Panel */}
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed inset-x-0 bottom-0 z-[80] max-h-[75vh] bg-zinc-950 border-t border-white/10 rounded-t-2xl overflow-hidden flex flex-col"
            >
              {/* Handle */}
              <div className="flex justify-center pt-3 pb-1">
                <div className="w-10 h-1 rounded-full bg-white/20" />
              </div>

              {/* Header */}
              <div className="flex items-center justify-between px-4 pb-3">
                <div className="flex items-center gap-3">
                  <img src={MIA_AVATAR} alt="MIA" className="w-8 h-8 rounded-full border border-gold" />
                  <div>
                    <h3 className="text-sm font-semibold text-white flex items-center gap-1">
                      MIA <Sparkles size={12} className="text-gold" />
                    </h3>
                    <p className="text-[10px] text-zinc-500 uppercase tracking-wider">Community Updates</p>
                  </div>
                </div>
                <button onClick={() => setIsOpen(false)} className="text-zinc-500 hover:text-white p-1">
                  <X size={18} />
                </button>
              </div>

              {/* Notification List */}
              <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-3 scrollbar-none">
                {notifications.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-zinc-500 text-sm">Alles ruhig gerade 😌</p>
                    <p className="text-zinc-600 text-xs mt-1">Ich melde mich, wenn was los ist!</p>
                  </div>
                ) : (
                  notifications.map((notification) => (
                    <motion.div
                      key={notification.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`p-3 rounded-xl border transition-colors ${
                        notification.seen
                          ? 'bg-zinc-900/50 border-white/5'
                          : 'bg-zinc-900 border-gold/20'
                      }`}
                    >
                      <p className="text-sm text-white/90 leading-relaxed">{notification.text}</p>
                      {notification.actionLabel && (
                        <button
                          onClick={() => handleAction(notification)}
                          className="mt-2 text-xs font-medium text-gold hover:text-gold-light transition-colors"
                        >
                          {notification.actionLabel} →
                        </button>
                      )}
                    </motion.div>
                  ))
                )}
              </div>

              {/* Chat CTA */}
              <div className="p-4 border-t border-white/5">
                <button
                  onClick={() => { onOpenChat?.(); setIsOpen(false); }}
                  className="w-full flex items-center justify-center gap-2 py-2.5 bg-gold/10 border border-gold/20 rounded-xl text-gold text-sm font-medium hover:bg-gold/20 transition-colors"
                >
                  <MessageCircle size={14} />
                  Mit MIA chatten
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};
