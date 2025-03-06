
import React, { useState } from 'react';
import { type Event } from '../types/eventTypes';
import { format, parseISO } from 'date-fns';
import { de } from 'date-fns/locale';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, MapPin, User, Heart, Sparkles, ExternalLink } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface EventDetailsProps {
  event: Event;
  onClose: () => void;
  onLike?: () => void;
}

const categoryColors: Record<string, string> = {
  'Konzert': 'bg-gradient-to-r from-pink-500 to-purple-500 text-white',
  'Party': 'bg-gradient-to-r from-orange-400 to-pink-500 text-white',
  'Ausstellung': 'bg-gradient-to-r from-amber-400 to-orange-500 text-white',
  'Sport': 'bg-gradient-to-r from-green-400 to-emerald-500 text-white',
  'Workshop': 'bg-gradient-to-r from-blue-400 to-indigo-500 text-white',
  'Kultur': 'bg-gradient-to-r from-purple-400 to-indigo-500 text-white',
  'Sonstiges': 'bg-gradient-to-r from-gray-400 to-slate-500 text-white',
  'Networking': 'bg-gradient-to-r from-cyan-400 to-blue-500 text-white',
  'Meeting': 'bg-gradient-to-r from-teal-400 to-cyan-500 text-white',
};

const EventDetails: React.FC<EventDetailsProps> = ({ event, onClose, onLike }) => {
  const [isOpen, setIsOpen] = useState(true);
  
  const handleClose = () => {
    setIsOpen(false);
    setTimeout(onClose, 300); // Allow animation to complete
  };

  const handleLike = () => {
    if (onLike) {
      onLike();
    }
  };
  
  // Format the date for display
  const formattedDate = format(parseISO(event.date), 'EEEE, d. MMMM yyyy', { locale: de });
  
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="backdrop-blur-sm bg-white/10 dark:bg-white/5 border border-white/20 rounded-xl shadow-xl max-w-md sm:max-w-lg animate-scale-in">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <DialogTitle className="text-2xl">{event.title}</DialogTitle>
              {event.link && (
                <a href={event.link} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4 text-white/70 hover:text-white" />
                </a>
              )}
            </div>
            <Badge className={cn(
              "ml-2 shadow-md",
              event.category in categoryColors 
                ? categoryColors[event.category] 
                : "bg-gradient-to-r from-teal-400 to-cyan-500 text-white"
            )}>
              {event.category}
            </Badge>
          </div>
          <DialogDescription className="text-white/80 mt-2">
            {event.description}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4 border-t border-b border-white/10">
          <div className="flex items-start">
            <Calendar className="h-5 w-5 mr-3 text-white/60" />
            <div>
              <div className="font-medium text-white">Datum</div>
              <div className="text-sm text-white/70">{formattedDate}</div>
            </div>
          </div>
          
          <div className="flex items-start">
            <Clock className="h-5 w-5 mr-3 text-white/60" />
            <div>
              <div className="font-medium text-white">Uhrzeit</div>
              <div className="text-sm text-white/70">{event.time} Uhr</div>
            </div>
          </div>
          
          <div className="flex items-start">
            <MapPin className="h-5 w-5 mr-3 text-white/60" />
            <div>
              <div className="font-medium text-white">Ort</div>
              <div className="text-sm text-white/70">{event.location}</div>
            </div>
          </div>
          
          <div className="flex items-start">
            <User className="h-5 w-5 mr-3 text-white/60" />
            <div>
              <div className="font-medium text-white">Organisator</div>
              <div className="text-sm text-white/70">{event.organizer}</div>
            </div>
          </div>
        </div>
        
        <DialogFooter className="flex justify-between">
          {onLike && (
            <Button 
              onClick={handleLike} 
              variant="outline"
              className="flex items-center gap-2 rounded-full border-white/20 hover:bg-white/10 relative group"
            >
              <Heart className={cn(
                "h-4 w-4 transition-all duration-300", 
                event.likes && event.likes > 0 
                  ? "fill-red-500 text-red-500" 
                  : "group-hover:scale-110 group-hover:text-pink-300"
              )} />
              <span>Gefällt mir</span>
              {event.likes && event.likes > 0 && (
                <>
                  <span className="ml-1">({event.likes})</span>
                  <Sparkles className="w-3 h-3 absolute -top-1 -right-1 text-yellow-400 animate-pulse" />
                </>
              )}
            </Button>
          )}
          <Button 
            onClick={handleClose} 
            className="rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600"
          >
            Schließen
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EventDetails;
