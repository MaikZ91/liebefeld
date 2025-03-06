
import React, { useState } from 'react';
import { type Event } from '../types/eventTypes';
import { format, parseISO } from 'date-fns';
import { de } from 'date-fns/locale';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, MapPin, User, Heart, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface EventDetailsProps {
  event: Event;
  onClose: () => void;
  onLike?: () => void;
}

const categoryColors: Record<string, string> = {
  'Networking': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
  'Workshop': 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
  'Sport': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  'Kultur': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
  'Meeting': 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
  'Party': 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-300',
  'Vortrag': 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300',
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
      <DialogContent className="glass-effect max-w-md sm:max-w-lg animate-scale-in">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-2xl">{event.title}</DialogTitle>
            <Badge className={cn(
              "ml-2",
              event.category in categoryColors 
                ? categoryColors[event.category] 
                : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
            )}>
              {event.category}
            </Badge>
          </div>
          <DialogDescription className="text-muted-foreground mt-2">
            {event.description}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="flex items-start">
            <Calendar className="h-5 w-5 mr-3 text-muted-foreground" />
            <div>
              <div className="font-medium">Datum</div>
              <div className="text-sm text-muted-foreground">{formattedDate}</div>
            </div>
          </div>
          
          <div className="flex items-start">
            <Clock className="h-5 w-5 mr-3 text-muted-foreground" />
            <div>
              <div className="font-medium">Uhrzeit</div>
              <div className="text-sm text-muted-foreground">{event.time} Uhr</div>
            </div>
          </div>
          
          <div className="flex items-start">
            <MapPin className="h-5 w-5 mr-3 text-muted-foreground" />
            <div>
              <div className="font-medium">Ort</div>
              <div className="text-sm text-muted-foreground">{event.location}</div>
            </div>
          </div>
          
          <div className="flex items-start">
            <User className="h-5 w-5 mr-3 text-muted-foreground" />
            <div>
              <div className="font-medium">Organisator</div>
              <div className="text-sm text-muted-foreground">{event.organizer}</div>
            </div>
          </div>
        </div>
        
        <DialogFooter className="flex justify-between">
          {onLike && (
            <Button 
              onClick={handleLike} 
              variant="outline"
              className="flex items-center gap-2 rounded-full"
            >
              <Heart className={cn("h-4 w-4", event.likes && event.likes > 0 ? "fill-red-500 text-red-500" : "")} />
              Gefällt mir {event.likes && event.likes > 0 ? `(${event.likes})` : ''}
            </Button>
          )}
          <Button onClick={handleClose} className="rounded-full">
            Schließen
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EventDetails;
