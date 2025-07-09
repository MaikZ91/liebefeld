import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getInitials } from '@/utils/chatUIUtils';
import { cn } from '@/lib/utils';

interface LikedUser {
  username: string;
  avatar_url?: string | null;
  timestamp: string;
}

interface EventLikeAvatarsProps {
  likedByUsers?: LikedUser[];
  maxVisible?: number;
  size?: 'sm' | 'xs';
  className?: string;
}

const EventLikeAvatars: React.FC<EventLikeAvatarsProps> = ({
  likedByUsers = [],
  maxVisible = 4,
  size = 'xs',
  className
}) => {
  const avatarSize = size === 'xs' ? 'w-4 h-4' : 'w-6 h-6';

  if (likedByUsers.length === 0) {
    return null;
  }

  const visibleLikes = likedByUsers.slice(0, maxVisible);
  const remainingCount = Math.max(0, likedByUsers.length - maxVisible);

  return (
    <div className={cn("flex items-center -space-x-1", className)}>
      {visibleLikes.map((user, index) => (
        <Avatar 
          key={`${user.username}-${user.timestamp}`}
          className={cn(
            avatarSize, 
            "border border-white/30 bg-black/50",
            "transition-transform hover:scale-110"
          )}
          style={{ zIndex: visibleLikes.length - index }}
        >
          <AvatarImage src={user.avatar_url || undefined} />
          <AvatarFallback className="bg-purple-600 text-white text-[8px]">
            {user.username ? getInitials(user.username) : '?'}
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