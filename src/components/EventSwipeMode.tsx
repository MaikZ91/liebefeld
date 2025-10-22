import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { X, Heart, ThumbsDown, MapPin, Clock, Calendar, Users } from 'lucide-react';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import { Event } from '@/types/eventTypes';
import { format, parseISO } from 'date-fns';
import { de } from 'date-fns/locale';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getInitials } from '@/utils/chatUIUtils';

interface EventSwipeModeProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  events: Event[];
  onLikeEvent: (eventId: string) => void;
}

const EventSwipeMode: React.FC<EventSwipeModeProps> = ({
  open,
  onOpenChange,
  events,
  onLikeEvent,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState<'left' | 'right' | null>(null);

  const currentEvent = events[currentIndex];

  useEffect(() => {
    if (open) {
      setCurrentIndex(0);
      setDirection(null);
    }
  }, [open]);

  const handleLike = () => {
    if (!currentEvent) return;
    setDirection('right');
    onLikeEvent(currentEvent.id);
    
    setTimeout(() => {
      if (currentIndex < events.length - 1) {
        setCurrentIndex(currentIndex + 1);
        setDirection(null);
      } else {
        onOpenChange(false);
      }
    }, 300);
  };

  const handleDislike = () => {
    setDirection('left');
    
    setTimeout(() => {
      if (currentIndex < events.length - 1) {
        setCurrentIndex(currentIndex + 1);
        setDirection(null);
      } else {
        onOpenChange(false);
      }
    }, 300);
  };

  const handleKeyPress = (e: KeyboardEvent) => {
    if (!open) return;
    if (e.key === 'ArrowLeft') handleDislike();
    if (e.key === 'ArrowRight') handleLike();
  };

  useEffect(() => {
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [open, currentIndex]);

  if (!currentEvent) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md bg-background border-border p-0 z-[9999]">
          <VisuallyHidden>
            <DialogTitle>Event Swipe Modus</DialogTitle>
          </VisuallyHidden>
          <div className="p-8 text-center">
            <p className="text-muted-foreground">Keine weiteren Events verfügbar</p>
            <Button 
              onClick={() => onOpenChange(false)}
              className="mt-4"
              variant="outline"
            >
              Schließen
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  const interestedUsers = currentEvent.liked_by_users || [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-background border-border p-0 overflow-hidden z-[9999]">
        <VisuallyHidden>
          <DialogTitle>Event Swipe Modus - {currentEvent.title}</DialogTitle>
        </VisuallyHidden>
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-2 right-2 z-10 bg-black/50 text-white hover:bg-black/70"
          onClick={() => onOpenChange(false)}
        >
          <X className="h-5 w-5" />
        </Button>

        <div 
          className={`transition-all duration-300 ${
            direction === 'left' ? '-translate-x-full opacity-0' : 
            direction === 'right' ? 'translate-x-full opacity-0' : 
            'translate-x-0 opacity-100'
          }`}
        >
          {/* Event Image */}
          <div className="relative h-64 w-full bg-muted">
            <img
              src={currentEvent.image_url || 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=400&h=300&fit=crop'}
              alt={currentEvent.title}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.currentTarget.src = 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=400&h=300&fit=crop';
              }}
            />
            <div className="absolute top-4 left-4 bg-primary text-primary-foreground px-3 py-1 rounded-full text-sm font-medium">
              {currentEvent.category}
            </div>
            <div className="absolute bottom-4 right-4 bg-black/70 text-white px-3 py-1 rounded-full text-sm flex items-center gap-1">
              {currentIndex + 1} / {events.length}
            </div>
          </div>

          {/* Event Details */}
          <div className="p-6 space-y-4">
            <h2 className="text-2xl font-bold text-foreground">{currentEvent.title}</h2>

            {currentEvent.description && (
              <p className="text-muted-foreground text-sm line-clamp-3">
                {currentEvent.description}
              </p>
            )}

            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="h-4 w-4 text-primary" />
                <span>
                  {format(parseISO(currentEvent.date), 'EEEE, dd. MMMM yyyy', { locale: de })}
                </span>
              </div>

              <div className="flex items-center gap-2 text-muted-foreground">
                <Clock className="h-4 w-4 text-primary" />
                <span>{currentEvent.time} Uhr</span>
              </div>

              <div className="flex items-center gap-2 text-muted-foreground">
                <MapPin className="h-4 w-4 text-primary" />
                <span>{currentEvent.location || 'Kein Ort angegeben'}</span>
              </div>
            </div>

            {/* Interested Users */}
            {interestedUsers.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Users className="h-4 w-4 text-primary" />
                  <span>{interestedUsers.length} {interestedUsers.length === 1 ? 'Person' : 'Personen'} interessiert</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {interestedUsers.slice(0, 6).map((user, index) => (
                    <div key={index} className="flex items-center gap-2 bg-muted px-2 py-1 rounded-full">
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={user.avatar_url || undefined} />
                        <AvatarFallback className="text-xs">
                          {getInitials(user.username)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-xs font-medium">{user.username}</span>
                    </div>
                  ))}
                  {interestedUsers.length > 6 && (
                    <div className="flex items-center justify-center bg-muted px-2 py-1 rounded-full">
                      <span className="text-xs text-muted-foreground">+{interestedUsers.length - 6} mehr</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-4 justify-center pt-4">
              <Button
                variant="outline"
                size="lg"
                className="w-16 h-16 rounded-full border-2 border-destructive hover:bg-destructive hover:text-destructive-foreground"
                onClick={handleDislike}
              >
                <ThumbsDown className="h-6 w-6" />
              </Button>
              <Button
                size="lg"
                className="w-16 h-16 rounded-full bg-primary hover:bg-primary/90"
                onClick={handleLike}
              >
                <Heart className="h-6 w-6 fill-current" />
              </Button>
            </div>

            <p className="text-xs text-center text-muted-foreground">
              Nutze die Pfeiltasten ← → oder klicke auf die Buttons
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EventSwipeMode;
