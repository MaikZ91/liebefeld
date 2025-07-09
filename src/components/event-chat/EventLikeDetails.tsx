import React from 'react';
import { Heart, Users, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getInitials } from '@/utils/chatUIUtils';
import { cn } from '@/lib/utils';

interface LikedUser {
  username: string;
  avatar_url?: string | null;
  timestamp: string;
}

interface EventLikeDetailsProps {
  likedByUsers: LikedUser[];
  totalLikes: number;
  onClose: () => void;
  className?: string;
}

const EventLikeDetails: React.FC<EventLikeDetailsProps> = ({
  likedByUsers,
  totalLikes,
  onClose,
  className
}) => {
  const registeredUsers = likedByUsers.filter(user => user.username && user.username !== 'Anonymous');
  const anonymousUsers = likedByUsers.filter(user => !user.username || user.username === 'Anonymous');

  return (
    <div className={cn(
      "bg-black/90 backdrop-blur-sm rounded-lg border border-white/10 p-4 max-w-sm mx-auto",
      className
    )}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Heart className="w-5 h-5 text-red-500 fill-current" />
          <span className="text-white font-semibold">{totalLikes} Likes</span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="text-white/70 hover:text-white p-1"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>

      <div className="space-y-4">
        {/* Registered Users */}
        {registeredUsers.length > 0 && (
          <div>
            <h4 className="text-white/70 text-sm font-medium mb-2 flex items-center gap-1">
              <Users className="w-4 h-4" />
              Community ({registeredUsers.length})
            </h4>
            <div className="space-y-2">
              {registeredUsers.map((user, index) => (
                <div key={`${user.username}-${user.timestamp}`} className="flex items-center gap-2">
                  <Avatar className="w-8 h-8">
                    <AvatarImage src={user.avatar_url || undefined} />
                    <AvatarFallback className="bg-purple-600 text-white text-xs">
                      {getInitials(user.username || 'User')}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-white text-sm">{user.username || 'Unbekannt'}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Anonymous Likes */}
        {anonymousUsers.length > 0 && (
          <div>
            <h4 className="text-white/70 text-sm font-medium mb-2">
              Anonyme Likes ({anonymousUsers.length})
            </h4>
            <div className="grid grid-cols-6 gap-2">
              {anonymousUsers.map((user, index) => (
                <Avatar key={`anonymous-${index}`} className="w-8 h-8">
                  <AvatarImage src={user.avatar_url || undefined} />
                  <AvatarFallback className="bg-gray-600 text-white text-xs">
                    ?
                  </AvatarFallback>
                </Avatar>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {likedByUsers.length === 0 && (
          <div className="text-center py-8">
            <Heart className="w-12 h-12 text-white/30 mx-auto mb-2" />
            <p className="text-white/70 text-sm">Noch keine Likes</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default EventLikeDetails;