import React, { useState, useEffect } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getEventLikes, type EventLike } from '@/services/eventLikeService';
import { getInitials } from '@/utils/chatUIUtils';
import { cn } from '@/lib/utils';

interface EventLikeAvatarsProps {
  eventId: string;
  maxVisible?: number;
  size?: 'sm' | 'xs';
  className?: string;
}

const EventLikeAvatars: React.FC<EventLikeAvatarsProps> = ({
  eventId,
  maxVisible = 4,
  size = 'xs',
  className
}) => {
  const [likes, setLikes] = useState<EventLike[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLikes = async () => {
      const { data } = await getEventLikes(eventId);
      setLikes(data || []);
      setLoading(false);
    };

    fetchLikes();
  }, [eventId]);

  if (loading || likes.length === 0) {
    return null;
  }

  const visibleLikes = likes.slice(0, maxVisible);
  const remainingCount = Math.max(0, likes.length - maxVisible);
  const avatarSize = size === 'xs' ? 'w-4 h-4' : 'w-6 h-6';

  return (
    <div className={cn("flex items-center -space-x-1", className)}>
      {visibleLikes.map((like, index) => (
        <Avatar 
          key={like.id} 
          className={cn(
            avatarSize, 
            "border border-white/30 bg-black/50",
            "transition-transform hover:scale-110"
          )}
          style={{ zIndex: visibleLikes.length - index }}
        >
          <AvatarImage src={like.avatar_url || undefined} />
          <AvatarFallback className="bg-purple-600 text-white text-[8px]">
            {like.username ? getInitials(like.username) : '?'}
          </AvatarFallback>
        </Avatar>
      ))}
      
      {remainingCount > 0 && (
        <div 
          className={cn(
            avatarSize,
            "bg-black/70 border border-white/30 rounded-full flex items-center justify-center",
            "text-white text-[8px] font-medium"
          )}
          style={{ zIndex: 0 }}
        >
          +{remainingCount}
        </div>
      )}
    </div>
  );
};

export default EventLikeAvatars;