import React from 'react';
import { Calendar, MapPin, Users, Heart, ExternalLink } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Event } from '@/types/eventTypes';

interface RichEventCardProps {
  event: Event;
  onLike?: (eventId: string) => void;
  onRSVP?: (eventId: string) => void;
  isLiked?: boolean;
  attendeeCount?: number;
}

export const RichEventCard: React.FC<RichEventCardProps> = ({
  event,
  onLike,
  onRSVP,
  isLiked = false,
  attendeeCount = 0
}) => {
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return new Intl.DateTimeFormat('de-DE', {
      weekday: 'short',
      day: '2-digit',
      month: 'short'
    }).format(date);
  };

  return (
    <Card className="overflow-hidden bg-black/60 border-white/15 hover:bg-black/70 transition-all duration-300 group">
      {event.image_url && (
        <div className="relative h-48 overflow-hidden">
          <img 
            src={event.image_url} 
            alt={event.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
          
          {event.category && (
            <Badge 
              className="absolute top-3 right-3 bg-primary text-primary-foreground border-0"
            >
              {event.category}
            </Badge>
          )}
        </div>
      )}
      
      <div className="p-4 space-y-3">
        <h3 className="font-semibold text-lg text-foreground line-clamp-2 group-hover:text-primary transition-colors">
          {event.title}
        </h3>
        
        <div className="space-y-2 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-primary" />
            <span>{formatDate(event.date)}</span>
            {event.time && <span>• {event.time}</span>}
          </div>
          
          {event.location && (
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-primary" />
              <span className="line-clamp-1">{event.location}</span>
            </div>
          )}
          
          {attendeeCount > 0 && (
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />
              <span>{attendeeCount} Interessiert</span>
            </div>
          )}
        </div>

        {event.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {event.description}
          </p>
        )}
        
        <div className="flex gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            className={`flex-1 ${isLiked ? 'bg-primary/20 border-primary' : 'border-white/20'}`}
            onClick={() => onLike?.(event.id)}
          >
            <Heart className={`h-4 w-4 mr-2 ${isLiked ? 'fill-primary text-primary' : ''}`} />
            Merken
          </Button>
          
          <Button
            size="sm"
            className="flex-1 bg-primary hover:bg-primary/90"
            onClick={() => onRSVP?.(event.id)}
          >
            Interessiert
          </Button>
          
          {event.link && (
            <Button
              variant="ghost"
              size="sm"
              asChild
            >
              <a href={event.link} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4" />
              </a>
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
};
