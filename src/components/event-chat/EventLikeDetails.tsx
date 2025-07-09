import React, { useState, useEffect } from 'react';
import { Heart, Users, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getEventLikes, type EventLike } from '@/services/eventLikeService';
import { getInitials } from '@/utils/chatUIUtils';
import { cn } from '@/lib/utils';

interface EventLikeDetailsProps {
  eventId: string;
  totalLikes: number;
  onClose: () => void;
  className?: string;
}

const EventLikeDetails: React.FC<EventLikeDetailsProps> = ({
  eventId,
  totalLikes,
  onClose,
  className
}) => {
  const [likes, setLikes] = useState<EventLike[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLikes = async () => {
      setLoading(true);
      setError(null);
      
      const { data, error: fetchError } = await getEventLikes(eventId);
      
      if (fetchError) {
        setError('Fehler beim Laden der Likes');
      } else {
        setLikes(data || []);
      }
      
      setLoading(false);
    };

    fetchLikes();
  }, [eventId]);

  const registeredUsers = likes.filter(like => like.user_id !== null);
  const anonymousLikes = likes.filter(like => like.user_id === null);

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

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <div className="text-white/70">Lädt...</div>
        </div>
      ) : error ? (
        <div className="text-red-400 text-center py-4">{error}</div>
      ) : (
        <div className="space-y-4">
          {/* Registered Users */}
          {registeredUsers.length > 0 && (
            <div>
              <h4 className="text-white/70 text-sm font-medium mb-2 flex items-center gap-1">
                <Users className="w-4 h-4" />
                Community ({registeredUsers.length})
              </h4>
              <div className="space-y-2">
                {registeredUsers.map((like) => (
                  <div key={like.id} className="flex items-center gap-2">
                    <Avatar className="w-8 h-8">
                      <AvatarImage src={like.avatar_url || undefined} />
                      <AvatarFallback className="bg-purple-600 text-white text-xs">
                        {getInitials(like.username || 'User')}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-white text-sm">{like.username || 'Unbekannt'}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Anonymous Likes */}
          {anonymousLikes.length > 0 && (
            <div>
              <h4 className="text-white/70 text-sm font-medium mb-2">
                Anonyme Likes ({anonymousLikes.length})
              </h4>
              <div className="grid grid-cols-6 gap-2">
                {anonymousLikes.map((like) => (
                  <Avatar key={like.id} className="w-8 h-8">
                    <AvatarImage src={like.avatar_url || undefined} />
                    <AvatarFallback className="bg-gray-600 text-white text-xs">
                      ?
                    </AvatarFallback>
                  </Avatar>
                ))}
              </div>
            </div>
          )}

          {/* Empty State */}
          {likes.length === 0 && (
            <div className="text-center py-8">
              <Heart className="w-12 h-12 text-white/30 mx-auto mb-2" />
              <p className="text-white/70 text-sm">Noch keine Likes</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default EventLikeDetails;